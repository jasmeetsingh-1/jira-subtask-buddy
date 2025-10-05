const express = require('express');
const axios = require('axios');
const config = require('../config.json');
const { convertMinutesToJiraFormat } = require('../utils/timeConverter');

const router = express.Router();
const JIRA_BASE_URL = config.jiraBaseUrl;

/**
 * 📝 Route: Log work time for multiple subtasks
 */
router.post('/log-work', async (req, res) => {
  console.log('🚀 [WORK LOG] Starting work log request');
  console.log('📥 [WORK LOG] Request body received:', JSON.stringify(req.body, null, 2));
  
  try {
    const { username, jessionID, totalMinutes, entries } = req.body;
    console.log('🔍 [WORK LOG] Extracted data:', { username, jessionID: jessionID ? '***' : 'missing', totalMinutes, entriesCount: entries?.length });

    // Validation
    console.log('✅ [WORK LOG] Starting validation...');
    if (!jessionID || !entries || !Array.isArray(entries)) {
      console.log('❌ [WORK LOG] Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: jessionID and entries array'
      });
    }

    if (entries.length === 0) {
      console.log('❌ [WORK LOG] Validation failed: Empty entries array');
      return res.status(400).json({
        success: false,
        message: 'Entries array cannot be empty'
      });
    }

    console.log(`✅ [WORK LOG] Validation passed. Starting work log for ${entries.length} entries, total: ${totalMinutes} minutes`);

    const results = [];
    const errors = [];
    console.log('📊 [WORK LOG] Initialized results and errors arrays');

    // Process each entry
    console.log(`🔄 [WORK LOG] Starting to process ${entries.length} entries...`);
    for (let i = 0; i < entries.length; i++) {
      console.log(`\n📋 [WORK LOG] Processing entry ${i + 1}/${entries.length}`);
      const entry = entries[i];
      const { subtaskId, subtaskKey, minutes, description } = entry;
      console.log(`🔍 [WORK LOG] Entry details:`, { subtaskId, subtaskKey, minutes, description });

      if (!subtaskKey || !minutes || minutes <= 0) {
        console.log(`❌ [WORK LOG] Entry ${i + 1} validation failed: Missing subtaskKey or invalid minutes`);
        errors.push({
          index: i,
          subtaskKey: subtaskKey || 'unknown',
          error: 'Missing subtaskKey or invalid minutes'
        });
        continue;
      }

      try {
        console.log(`✅ [WORK LOG] Entry ${i + 1} validation passed`);
        
        // Convert minutes to Jira format
        console.log(`⏰ [WORK LOG] Converting ${minutes} minutes to Jira format...`);
        const timeSpent = convertMinutesToJiraFormat(minutes);
        console.log(`⏰ [WORK LOG] Converted time: ${timeSpent}`);
        
        // Get current timestamp for started field with timezone offset
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
        const offsetMinutes = Math.abs(timezoneOffset) % 60;
        const offsetSign = timezoneOffset <= 0 ? '+' : '-';
        const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}${offsetMinutes.toString().padStart(2, '0')}`;
        
        const started = now.toISOString().replace('Z', offsetString);
        console.log(`📅 [WORK LOG] Generated timestamp: ${started} (timezone offset: ${offsetString})`);
        
        // Prepare worklog payload
        const worklogPayload = {
          comment: description || `Worked on ${subtaskKey}`,
          started: started,
          timeSpent: timeSpent
        };
        console.log(`📦 [WORK LOG] Prepared worklog payload:`, JSON.stringify(worklogPayload, null, 2));

        console.log(`🌐 [WORK LOG] Making API call to Jira for ${subtaskKey}...`);
        console.log(`🔗 [WORK LOG] API URL: ${JIRA_BASE_URL}/rest/api/2/issue/${subtaskKey}/worklog`);

        // Make API call to Jira
        const response = await axios.post(
          `${JIRA_BASE_URL}/rest/api/2/issue/${subtaskKey}/worklog`,
          worklogPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': `JSESSIONID=${jessionID}`
            }
          }
        );

        console.log(`📡 [WORK LOG] API response received for ${subtaskKey}:`, {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });

        if (response.status === 201) {
          const result = {
            id: response.data.id,
            time: timeSpent,
            subtaskKey: subtaskKey,
            minutes: minutes
          };
          results.push(result);
          console.log(`✅ [WORK LOG] Successfully logged work for ${subtaskKey}:`, result);
        } else {
          console.log(`⚠️ [WORK LOG] Unexpected status code for ${subtaskKey}: ${response.status}`);
        }

      } catch (err) {
        console.error(`❌ [WORK LOG] Failed to log work for ${subtaskKey}:`, {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          config: {
            url: err.config?.url,
            method: err.config?.method,
            headers: err.config?.headers
          }
        });
        errors.push({
          index: i,
          subtaskKey: subtaskKey,
          error: err?.response?.data || err.message
        });
      }
    }

    // Prepare response
    console.log(`\n📊 [WORK LOG] Processing completed. Preparing final response...`);
    console.log(`📈 [WORK LOG] Summary: ${results.length} successful, ${errors.length} failed out of ${entries.length} total`);
    
    const response = {
      success: true,
      message: `Work logging completed. ${results.length} successful, ${errors.length} failed.`,
      totalEntries: entries.length,
      successfulEntries: results.length,
      failedEntries: errors.length,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`📤 [WORK LOG] Final response prepared:`, JSON.stringify(response, null, 2));
    console.log(`✅ [WORK LOG] Work log completed: ${results.length}/${entries.length} successful`);

    res.status(200).json(response);

  } catch (err) {
    console.error("💥 [WORK LOG] Critical error in work log route:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({
      success: false,
      message: 'Failed to process work log request',
      error: err.message
    });
  }
});

module.exports = router;
