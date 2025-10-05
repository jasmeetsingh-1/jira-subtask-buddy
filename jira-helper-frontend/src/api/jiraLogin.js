// POST to /jiraHelper/login
import CryptoJS from 'crypto-js';
import config from '../config/default.json';

const loginToJira = async (username, password) => {
  const secretKey = config.secretKey;
  const credentials = btoa(`${username}:${password}`);
  const encrypted = CryptoJS.AES.encrypt(credentials, secretKey).toString();
  const res = await fetch(`${config.backend}/jiraHelper/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${encrypted}`
    }

  });

  return res.json();
};

const getUserDetails = async (jsid) => {
  const res = await fetch(`${config.backend}/jiraHelper/user-info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jsid }),
  });

  return res.json();
};

export { loginToJira, getUserDetails };