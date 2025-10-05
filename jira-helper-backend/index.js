const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config.json'); // Load secret key from config

const app = express();
app.use(cors());
app.use(bodyParser.json());
const CryptoJS = require('crypto-js');
const JIRA_BASE_URL = config.jiraBaseUrl;

const userTicketsRoute = require('./routes/userTickets'); //new rputes
const userWorkLogRoute = require('./routes/userWorkLog'); //work log routes

// 🔐 Login check route
app.post('/jiraHelper/login', async (req, res) => {
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

const decrypt = (cipher) => {
  const bytes = CryptoJS.AES.decrypt(cipher, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

app.post('/jiraHelper/get-session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid Authorization header"
      });
    }

    // 🔑 Decrypt the encrypted token from client
    const encryptedToken = authHeader.split(" ")[1];
    const decrypted = decrypt(encryptedToken);

    if (!decrypted) {
      throw new Error("Failed to decrypt credentials");
    }

    // decrypted should be "username:apiToken"
    const decoded = Buffer.from(decrypted, "base64").toString();
    const [username, apiToken] = decoded.split(":");

    if (!username || !apiToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid decrypted credentials format"
      });
    }

    // Encode for Basic Auth
    const authToken = Buffer.from(`${username}:${apiToken}`).toString("base64");

    // Call Jira to start a session
    const response = await axios.post(
      `${JIRA_BASE_URL}/rest/auth/1/session`,
      {}, // body not needed when using Basic Auth
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${authToken}`
        }
      }
    );

    // Extract JSESSIONID from cookie
    const cookies = response.headers["set-cookie"] || [];
    const jsessionId = cookies
      .map(c => c.split(";")[0])
      .find(c => c.startsWith("JSESSIONID="))
      ?.replace("JSESSIONID=", "");

    if (!jsessionId) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve JSESSIONID from Jira response"
      });
    }

    res.status(200).json({
      success: true,
      message: "Session created successfully",
      jsessionId,
      rawResponse: response.data // optional
    });

  } catch (err) {
    console.error("Jira login failed >>>", err?.response?.data || err.message);
    res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: err?.response?.data || err.message
    });
  }
});

app.post('/jiraHelper/user-info', async (req, res) => {
  const { jsid } = req.body; // expect jsid from frontend

  if (!jsid) {
    return res.status(400).json({
      success: false,
      message: 'Missing JSESSIONID',
    });
  }

  try {
    const response = await axios.get(`${JIRA_BASE_URL}/rest/api/2/myself`, {
      headers: {
        Accept: 'application/json',
        Cookie: `JSESSIONID=${jsid}`, // send Jira session cookie
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
// app.post('/jiraHelper/create-subtask', async (req, res) => {
//   const authHeader = req.headers.authorization;
//   const secretKey = config.secretKey;

//   if (!authHeader || !authHeader.startsWith('Basic ')) {
//     return res.status(400).json({
//       success: false,
//       message: 'Missing or invalid Authorization header',
//     });
//   }
//   try {
//     const encryptedToken = authHeader.split(' ')[1];
//     const bytes = CryptoJS.AES.decrypt(encryptedToken, secretKey);
//     const decrypted = bytes.toString(CryptoJS.enc.Utf8);

//     if (!decrypted) {
//       throw new Error("Failed to decrypt, possibly invalid key or token");
//     }

//     const decoded = Buffer.from(decrypted, 'base64').toString();
//     const [username, apiToken] = decoded.split(':');
//     const authToken = Buffer.from(`${username}:${apiToken}`).toString('base64');

//     const subTasks = req.body;

//     if (!Array.isArray(subTasks)) {
//       return res.status(400).json({
//         success: false,
//         message: "Expected request body to be an array of subtasks",
//       });
//     }

//     const requests = subTasks.map((subTask, index) => {
//       console.log(subTask);
//     const fields = {
//       project: { key: subTask.parentKey.split('-')[0] },
//       parent: { key: subTask.parentKey },
//       summary: subTask.summary,
//       description: subTask.description || "",
//       issuetype: { name: 'Sub-task' },
//       customfield_14700: { id: subTask.workTypeId },
//       customfield_13738: subTask.timesheetPath || ''
//     };

//     if (subTask.username) {
//       fields.assignee = { name: subTask.username };
//     }

//     return axios.post(`${JIRA_BASE_URL}/rest/api/2/issue`, {
//       fields
//     }, {
//       headers: {
//         Authorization: `Basic ${authToken}`,
//         'Content-Type': 'application/json'
//       }
//     }).then(response => ({
//       status: 'fulfilled',
//       data: response.data,
//       index
//     })).catch(error => ({
//       status: 'rejected',
//       error: error?.response?.data || error.message,
//       index,
//       input: subTask
//     }));

//     });

//     const results = await Promise.all(requests);

//     const successful = results.filter(r => r.status === 'fulfilled');
//     const failed = results.filter(r => r.status === 'rejected');

//     res.status(200).json({
//       success: true,
//       message: "Sub-task creation completed.",
//       total: results.length,
//       successfulCount: successful.length,
//       failedCount: failed.length,
//       failedRequests: failed.map(f => ({
//         index: f.index + 1,
//         reason: f.error,
//         parameters: f.input
//       })),
//       successfulResults: successful.map(s => s.data)
//     });

//   } catch (err) {
//     console.error("Token decryption or setup error >>>", err);
//     res.status(500).json({
//       success: false,
//       message: 'Authentication or setup failed',
//       error: err.message
//     });
//   }
// });

app.post('/jiraHelper/create-subtask', async (req, res) => {
  console.log("header >>>>>>", req.headers['x-jsessionid']);
  try {
    const jsessionId = req.headers['x-jsessionid']; // custom header from client
    console.log("jsessionid >>>>>", {jsessionId});

    if (!jsessionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing JSESSIONID in request headers'
      });
    }

    const subTasks = req.body;

    if (!Array.isArray(subTasks)) {
      return res.status(400).json({
        success: false,
        message: "Expected request body to be an array of subtasks",
      });
    }

    const requests = subTasks.map((subTask, index) => {
      console.log(subTask);
    const fields = {
      project: { key: subTask.parentKey.split('-')[0] },
      parent: { key: subTask.parentKey },
      summary: subTask.summary,
      description: subTask.description || "",
      issuetype: { name: 'Sub-task' },
      customfield_14700: { id: subTask.workTypeId },
      customfield_13738: subTask.timesheetPath || ''
    };

      if (subTask.username) {
        fields.assignee = { name: subTask.username };
      }

      return axios.post(`${JIRA_BASE_URL}/rest/api/2/issue`, { fields }, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `JSESSIONID=${jsessionId}`  // 🔑 Auth via session cookie
        }
      })
      .then(response => {
        console.log(`✅ Sub-task [${index + 1}] created successfully >>>`, response.data);
        return {
          status: 'fulfilled',
          data: response.data,
          index
        };
      })
      .catch(error => {
        console.error(`❌ Sub-task [${index + 1}] creation failed >>>`, error?.response?.data || error.message);
        return {
          status: 'rejected',
          error: error?.response?.data || error.message,
          index,
          input: subTask
        };
      })
      .finally(() => {
        console.log(`ℹ️ Finished processing sub-task [${index + 1}] with summary: "${subTask.summary}"`);
      });
    });

    const results = await Promise.all(requests);

    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    res.status(200).json({
      success: true,
      message: "Sub-task creation completed.",
      total: results.length,
      successfulCount: successful.length,
      failedCount: failed.length,
      failedRequests: failed.map(f => ({
        index: f.index + 1,
        reason: f.error,
        parameters: f.input
      })),
      successfulResults: successful.map(s => s.data)
    });

  } catch (err) {
    console.error("Token decryption or setup error >>>", err);
    res.status(500).json({
      success: false,
      message: 'Authentication or setup failed',
      error: err.message
    });
  }
});


app.post('/jiraHelper/tickets', async (req, res) => {
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

app.use('/userTickets', userTicketsRoute); // ✅ This mounts /userTickets/getAllTicket
app.use('/user-work-log', userWorkLogRoute); // ✅ This mounts /user-work-log/log-work

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});