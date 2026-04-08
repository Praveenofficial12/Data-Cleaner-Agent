const API_BASE = 'http://localhost:8000'

export async function listTasks() {
  const res = await fetch(`${API_BASE}/tasks`)
  return res.json()
}

export async function resetEnv(taskName) {
  const res = await fetch(`${API_BASE}/env/reset?task_name=${taskName}`, { method: 'POST' })
  return res.json()
}

export async function stepEnv(sessionId, action) {
  const res = await fetch(`${API_BASE}/env/step/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action)
  })
  return res.json()
}

export async function getState(sessionId) {
  const res = await fetch(`${API_BASE}/env/state/${sessionId}`)
  return res.json()
}

export async function runGrader(sessionId) {
  const res = await fetch(`${API_BASE}/grader/${sessionId}`)
  return res.json()
}

export async function runBaseline(taskName) {
  const res = await fetch(`${API_BASE}/baseline?task_name=${taskName}`, { method: 'POST' })
  return res.json()
}
