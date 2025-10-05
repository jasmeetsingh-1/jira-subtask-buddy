import config from '../config/default.json';

// Get jsid from Redux store
const getJsid = () => {
  const store = JSON.parse(localStorage.getItem('persist:jira-task-manager') || '{}');
  const authState = JSON.parse(store.auth || '{}');
  return authState.jsid || '';
};

const logWork = async (payload) => {
  console.log("Logging work with payload:", payload);
  const jsid = getJsid();
  
  const requestBody = {
    username: payload.username,
    jessionID: jsid,
    totalMinutes: payload.totalMinutes,
    entries: payload.entries
  };

  console.log("Request body:", requestBody);

  const res = await fetch(`${config.backend}/user-work-log/log-work`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const result = await res.json();
  console.log("Work log response:", result);
  return result;
};

export { logWork };
