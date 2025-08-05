import config from '../config/default.json';
const createSubtask = async (token ,subtaskArray) => {
  console.log('api hit started', token)
  const res = await fetch(`${config.backend}/api/create-subtask`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Basic ${token}`
     },
    body: JSON.stringify(subtaskArray)
  });
  return res.json();
};

export {createSubtask};