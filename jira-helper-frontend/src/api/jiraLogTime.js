import config from '../config/default.json';
const getAllTickets = async (username) => {
  const res = await fetch(`${config.backend}/userTickets/getAllTickets`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-jsessionid' : config.jSessionId
     },
    body: JSON.stringify({ userName: username })
  });
  return res.json();
};

export {getAllTickets};