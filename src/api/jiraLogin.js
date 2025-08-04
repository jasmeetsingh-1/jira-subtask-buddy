// POST to /api/login
const loginToJira = async (username, password) => {
  const res = await fetch('http://localhost:8081/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
};

const getUserDetails = async (username, password) => {
  const res = await fetch('http://localhost:8081/api/user-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export { loginToJira, getUserDetails };