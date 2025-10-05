import config from '../config/default.json';

// Get jsid from Redux store
const getJsid = () => {
  const store = JSON.parse(localStorage.getItem('persist:jira-task-manager') || '{}');
  const authState = JSON.parse(store.auth || '{}');
  return authState.jsid || '';
};

const getAllTickets = async (username) => {
  const jsid = getJsid();
  console.log("trying to hit >>>", username, jsid);
  const res = await fetch(`${config.backend}/userTickets/getAllTickets`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-jsessionid' : jsid
     },
    body: JSON.stringify({ userName: username })
  });
  return res.json();
};

export {getAllTickets};