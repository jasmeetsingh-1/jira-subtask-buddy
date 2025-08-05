// index.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config.json'); // Load secret key from config

const app = express();
app.use(cors());
app.use(bodyParser.json());
const CryptoJS = require('crypto-js');

const JIRA_BASE_URL = config.jiraBaseUrl

// 🔐 Login check route
app.post('/api/login', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = config.secretKey;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid Authorization header',
    });
  }
  const encryptedToken = authHeader.split(' ')[1];

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error("Failed to decrypt, possibly invalid key or token");
    }
    const decoded = Buffer.from(decrypted, 'base64').toString();
    const [username, apiToken] = decoded.split(':');
    const authToken = Buffer.from(`${username}:${apiToken}`).toString('base64');

    await axios.get(`${JIRA_BASE_URL}/rest/api/2/myself`, {
      headers: {
        Authorization: `Basic ${authToken}`,
      },
    });

    res.json({
      success: true,
      token: encryptedToken,
    });
  } catch (err) {
    console.error('Login failed >>>', err.message);
    res.status(401).json({
      success: false,
      message: 'Invalid credentials or decryption error',
    });
  }
});




app.post('/api/user-info', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = config.secretKey;;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid Authorization header',
    });
  }
  const encryptedToken = authHeader.split(' ')[1];

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error("Failed to decrypt Authorization header");
    }
    const decoded = Buffer.from(decrypted, 'base64').toString();
    const [username, apiToken] = decoded.split(':');
    const jiraAuth = Buffer.from(`${username}:${apiToken}`).toString('base64');

    const response = await axios.get(`${JIRA_BASE_URL}/rest/api/2/myself`, {
      headers: {
        Authorization: `Basic ${jiraAuth}`,
        Accept: 'application/json',
      },
    });

    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error('Error fetching Jira user info:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Jira user info',
      error: err.response?.data || err.message,
    });
  }
});


// 📌 Create sub-task route
app.post('/api/create-subtask', async (req, res) => {
  const { token, parentKey, summary, workTypeId, timesheetPath, description = "" } = req.body;
  const { authorization } = req.headers;
  console.log("Creating sub-task with data:", req.headers);

  try {
    const response = await axios.post(`${JIRA_BASE_URL}/rest/api/2/issue`, {
      fields: {
        project: { key: parentKey.split('-')[0] }, // e.g. 'SU'
        parent: { key: parentKey },               // e.g. 'SU-68200'
        summary,
        description: description,
        issuetype: { name: 'Sub-task' },
        customfield_14700: { id: workTypeId },     // Work Type
        customfield_13738: timesheetPath || ''     // Timesheet Path
      },
    }, {
      headers: {
        Authorization: `Basic ${authorization}`, // Use Basic token (not Bearer)
        'Content-Type': 'application/json'
      }
    });

    console.log("Sub-task created successfully >>>", response.data);

    res.json({ success: true, issue: response.data });
  } catch (err) {
    console.error("Sub-task creation error >>>", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create sub-task',
      error: err.response?.data || err.message
    });
  }
});


app.post('/api/tickets', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  try {
    const jql = encodeURIComponent(
      'assignee = currentUser() AND statusCategory != Done AND updated >= -15d ORDER BY updated DESC'
    );
    const url = `https://jira.grazitti.com/rest/api/2/search?jql=${jql}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${token}`,
        Accept: 'application/json',
      },
    });

    // Remove all customfield_* fields
    const cleanedIssues = response.data.issues.map(issue => {
      const filteredFields = Object.fromEntries(
        Object.entries(issue.fields).filter(
          ([key]) => !key.startsWith('customfield_')
        )
      );

      return {
        key: issue.key,
        fields: filteredFields,
      };
    });

    res.json({
      success: true,
      issues: cleanedIssues,
    });
  } catch (error) {
    console.error('Error fetching tickets:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.response?.data || error.message,
    });
  }
});

const PORT = 8081;
app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});