import config from '../config/default.json';

// Get jsid from Redux store
const getJsid = () => {
  const store = JSON.parse(localStorage.getItem('persist:jira-task-manager') || '{}');
  const authState = JSON.parse(store.auth || '{}');
  return authState.jsid || '';
};

const createSubtask = async (subtaskArray) => {
  console.log('api hit started')
  const jsid = getJsid();
  const res = await fetch(`${config.backend}/jiraHelper/create-subtask`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-jsessionid' : jsid
     },
    body: JSON.stringify(subtaskArray)
  });
  return res.json();
};

export {createSubtask};