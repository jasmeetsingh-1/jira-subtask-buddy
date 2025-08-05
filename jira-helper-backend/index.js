// index.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JIRA_BASE_URL = 'https://jira.grazitti.com';

// 🔐 Login check route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const token = Buffer.from(`${username}:${password}`).toString('base64');

  try {
    // Call /myself to validate credentials
    await axios.get(`${JIRA_BASE_URL}/rest/api/2/myself`, {
      headers: {
        Authorization: `Basic ${token}`,
      },
    });

    // Only return the token if valid
    res.json({
      success: true,
      token: token,
    });
  } catch (err) {
    console.error("Login failed >>>", err.message);
    res.status(401).json({
      success: false,
      message: 'Invalid username or password',
    });
  }
});


app.post('/api/user-info', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

    const response = await axios.get('https://jira.grazitti.com/rest/api/2/myself', {
      headers: {
        Authorization: authHeader,
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
        Authorization: `Basic ${token}`, // Use Basic token (not Bearer)
        'Content-Type': 'application/json'
      }
    });

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