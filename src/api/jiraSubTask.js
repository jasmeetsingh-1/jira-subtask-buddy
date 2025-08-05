// POST to /api/create-subtask
const createSubtask = async (token, parentKey, summary) => {
  const res = await fetch(`${config.backend}/api/create-subtask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      parentKey,
      summary,
      workTypeId: '16701', // Development
      timesheetPath: 'my/time/path'
    })
  });
  return res.json();
};

export {createSubtask};