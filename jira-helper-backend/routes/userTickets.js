const express = require('express');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const config = require('../config.json');

const router = express.Router();
const JIRA_BASE_URL = config.jiraBaseUrl;

/**
 * 📌 Middleware: Decrypt the Jira token from Authorization header
 */
async function decryptTokenMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const secretKey = config.secretKey;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid Authorization header',
    });
  }

  try {
    const encryptedToken = authHeader.split(' ')[1];
    const bytes = CryptoJS.AES.decrypt(encryptedToken, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Failed to decrypt token');

    const decoded = Buffer.from(decrypted, 'base64').toString();
    const [username, apiToken] = decoded.split(':');
    req.authToken = Buffer.from(`${username}:${apiToken}`).toString('base64');

    next();
  } catch (err) {
    console.error('Token decryption error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Token decryption failed',
      error: err.message,
    });
  }
}

/**
 * 📌 Middleware: Fetch subtasks for each issue
 */
async function fetchSubtasksMiddleware(req, res, next) {
  const { issues, authToken } = req;

  try {
    const issueMap = new Map();

    for (const issue of issues) {
      try {
        const response = await axios.get(
          `${JIRA_BASE_URL}/rest/api/2/issue/${issue.key}?fields=parent,subtasks,summary`,
          {
            headers: {
              Authorization: `Basic ${authToken}`,
              Accept: 'application/json',
            },
          }
        );

        const issueData = response.data;

        // Determine main issue
        let mainIssue;
        if (issueData.fields.parent) {
          mainIssue = {
            id: issueData.fields.parent.id,
            key: issueData.fields.parent.key,
            summary: issueData.fields.parent.fields.summary,
          };
        } else {
          mainIssue = {
            id: issueData.id,
            key: issueData.key,
            summary: issueData.fields.summary,
          };
        }

        // Fetch subtasks with id, key, summary, and status.name
        let subtasks = [];
        if (issueData.fields.subtasks?.length) {
          const subtaskPromises = issueData.fields.subtasks.map(async (sub) => {
            try {
              const subRes = await axios.get(
                `${JIRA_BASE_URL}/rest/api/2/issue/${sub.key}?fields=summary,status`,
                {
                  headers: {
                    Authorization: `Basic ${authToken}`,
                    Accept: 'application/json',
                  },
                }
              );
              return {
                id: subRes.data.id,
                key: subRes.data.key,
                summary: subRes.data.fields.summary,
                status: subRes.data.fields.status?.name || "Unknown"
              };
            } catch (subErr) {
              console.error(`Failed to fetch subtask ${sub.key}`, subErr.message);
              return null;
            }
          });

          const subtaskResults = await Promise.all(subtaskPromises);
          subtasks = subtaskResults.filter(Boolean);
        }

        // Merge into map (ensuring uniqueness of main issue)
        if (!issueMap.has(mainIssue.key)) {
          issueMap.set(mainIssue.key, {
            mainissue: mainIssue,
            subtask: subtasks,
          });
        } else {
          const existing = issueMap.get(mainIssue.key);
          existing.subtask = [...existing.subtask, ...subtasks];
          issueMap.set(mainIssue.key, existing);
        }
      } catch (err) {
        console.error(`Failed to fetch details for ${issue.key}`, err.message);
      }
    }

    req.issuesWithSubtasks = Array.from(issueMap.values());
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * 📌 Route: Get all tickets assigned to the given user
 */
router.post(
  '/getAllTickets',
  decryptTokenMiddleware,
  async (req, res, next) => {
    const authToken = req.authToken;
    const { userName } = req.body; // ✅ using userName

    try {
      const jql = `assignee="${userName}" order by updated DESC`;
      const issuesRes = await axios.get(
        `${JIRA_BASE_URL}/rest/api/2/search?jql=${encodeURIComponent(jql)}`,
        { headers: { Authorization: `Basic ${authToken}` } }
      );

      req.issues = issuesRes.data.issues.map((i) => ({
        key: i.key,
      }));
      req.authToken = authToken;

      next();
    } catch (err) {
      console.error('Error in /userTickets/getAllTickets:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tickets',
        error: err.message,
      });
    }
  },
  async (req, res) => {
    try {
      const authToken = req.authToken;

      // Fetch full issue details for each ticket
      const uniqueMainIssues = new Map();

      for (const issue of req.issues) {
        const issueRes = await axios.get(
          `${JIRA_BASE_URL}/rest/api/2/issue/${issue.key}`,
          { headers: { Authorization: `Basic ${authToken}` } }
        );

        const data = issueRes.data;

        // If subtask, use parent as main issue
        const mainIssue = data.fields.parent || data;

        const mainKey = mainIssue.key;

        if (!uniqueMainIssues.has(mainKey)) {
          // Sprint handling (works for standard and custom field)
          const sprintField = mainIssue.fields?.sprint || mainIssue.fields?.customfield_10020?.[0] || null;
          const sprintData = sprintField
            ? {
                id: sprintField.id,
                name: sprintField.name,
                state: sprintField.state,
              }
            : null;

          uniqueMainIssues.set(mainKey, {
            parent: {
              id: mainIssue.id,
              key: mainIssue.key,
              summary: mainIssue.fields.summary,
            },
            sprint: sprintData,
            subtasks: [],
          });
        }

        // If it's a subtask, add it to the parent's subtasks
        if (data.fields.issuetype?.subtask) {
          const parentKey = data.fields.parent.key;
          const parentEntry = uniqueMainIssues.get(parentKey);

          if (parentEntry) {
            parentEntry.subtasks.push({
              id: data.id,
              key: data.key,
              summary: data.fields.summary,
              status: data.fields.status?.name || '',
            });
          }
        }
      }

      res.json({
        success: true,
        totalMainIssues: uniqueMainIssues.size,
        issues: Array.from(uniqueMainIssues.values()),
      });
    } catch (err) {
      console.error('Error assembling issues:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to assemble ticket data',
        error: err.message,
      });
    }
  }
);

module.exports = router;