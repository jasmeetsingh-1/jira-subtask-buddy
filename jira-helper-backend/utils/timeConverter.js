/**
 * Convert minutes to Jira worklog format (3w 4d 12h 30m)
 * @param {number} minutes - Total minutes to convert
 * @returns {string} - Formatted time string
 */
function convertMinutesToJiraFormat(minutes) {
  if (minutes <= 0) return "0m";
  
  const weeks = Math.floor(minutes / (7 * 5 * 8 * 60)); // 7 days * 5 work days * 8 hours * 60 minutes
  const remainingAfterWeeks = minutes % (7 * 5 * 8 * 60);
  
  const days = Math.floor(remainingAfterWeeks / (8 * 60)); // 8 hours * 60 minutes
  const remainingAfterDays = remainingAfterWeeks % (8 * 60);
  
  const hours = Math.floor(remainingAfterDays / 60);
  const remainingMinutes = remainingAfterDays % 60;
  
  const parts = [];
  
  if (weeks > 0) parts.push(`${weeks}w`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (remainingMinutes > 0) parts.push(`${remainingMinutes}m`);
  
  return parts.join(' ') || "0m";
}

/**
 * Convert minutes to simple hours format (e.g., "2h 30m" or "1h" or "45m")
 * @param {number} minutes - Total minutes to convert
 * @returns {string} - Formatted time string
 */
function convertMinutesToSimpleFormat(minutes) {
  if (minutes <= 0) return "0m";
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  const parts = [];
  
  if (hours > 0) parts.push(`${hours}h`);
  if (remainingMinutes > 0) parts.push(`${remainingMinutes}m`);
  
  return parts.join(' ') || "0m";
}

module.exports = {
  convertMinutesToJiraFormat,
  convertMinutesToSimpleFormat
};
