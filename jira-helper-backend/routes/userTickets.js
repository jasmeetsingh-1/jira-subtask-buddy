const express = require('express');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const config = require('../config.json');

const router = express.Router();
const JIRA_BASE_URL = config.jiraBaseUrl;

/**
 * 📌 Middleware: Decrypt Jira token from Authorization header
 * - Expected: AES encrypted Base64("username:apiToken")
 * - Produces: { username, apiToken }
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

    if (!username || !apiToken) {
      throw new Error('Invalid decrypted credentials');
    }

    req.username = username;
    req.apiToken = apiToken;
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
 * 📌 Route: Get JSESSIONID from Jira
 */
router.post('/get-session', decryptTokenMiddleware, async (req, res) => {
  try {
    const { username, apiToken } = req;

    const response = await axios.post(
      `${JIRA_BASE_URL}/rest/auth/1/session`,
      { username, password: apiToken }, // Jira expects "password" but it can be an API token
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Extract JSESSIONID from cookie
    const cookies = response.headers['set-cookie'] || [];
    const jsessionId = cookies
      .map((c) => c.split(';')[0])
      .find((c) => c.startsWith('JSESSIONID='))
      ?.replace('JSESSIONID=', '');

    if (!jsessionId) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve JSESSIONID from Jira response',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session created successfully',
      jsessionId,
      rawResponse: response.data, // Optional
    });
  } catch (err) {
    console.error('Jira login failed >>>', err?.response?.data || err.message);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: err?.response?.data || err.message,
    });
  }
});

/**
 * 📌 Route: Get all tickets assigned to a given user (using JSESSIONID)
 */
router.post('/getAllTickets', async (req, res) => {
  const { userName } = req.body;
  const jsessionId = req.headers['x-jsessionid'];

  if (!jsessionId || !userName) {
    return res.status(400).json({
      success: false,
      message: 'jsessionId and userName are required',
    });
  }

  try {
    const jql = `assignee="${userName}" order by updated DESC`;

    const issuesRes = await axios.get(
      `${JIRA_BASE_URL}/rest/api/2/search?jql=${encodeURIComponent(jql)}`,
      {
        headers: {
          Cookie: `JSESSIONID=${jsessionId}`,
          Accept: 'application/json',
        },
      }
    );

    const issues = issuesRes.data.issues.map((i) => ({ key: i.key }));

    // Fetch full issue details and group by main issue
    const uniqueMainIssues = new Map();

    for (const issue of issues) {
      const issueRes = await axios.get(
        `${JIRA_BASE_URL}/rest/api/2/issue/${issue.key}`,
        {
          headers: {
            Cookie: `JSESSIONID=${jsessionId}`,
            Accept: 'application/json',
          },
        }
      );

      const data = issueRes.data;

      // If subtask, parent is main issue
      const mainIssue = data.fields.parent || data;
      const mainKey = mainIssue.key;

      if (!uniqueMainIssues.has(mainKey)) {
        // Handle sprint field
        const sprintField =
          mainIssue.fields?.sprint ||
          mainIssue.fields?.customfield_10020?.[0] ||
          null;
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

      // Add subtask if applicable
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
    console.error('Error in /getAllTickets:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: err.message,
    });
  }
});

module.exports = router;
