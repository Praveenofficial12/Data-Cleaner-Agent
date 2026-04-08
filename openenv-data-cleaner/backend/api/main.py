from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict, Any, List
import uuid
import sys
import os

# ── Path resolution ───────────────────────────────────────────────────────────
# Works whether launched as `uvicorn api.main:app` from backend/
# or as `uvicorn backend.api.main:app` from project root.
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from models.schemas import Observation, Action, Reward
from env.environment import DataCleaningEnv
from graders.grader import grade_episode
from tasks.data_tasks import TASKS

# ── In-memory session store ────────────────────────────────────────────────────
sessions: Dict[str, DataCleaningEnv] = {}

# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 DataClean OpenEnv API starting up…")
    print(f"   Available tasks: {list(TASKS.keys())}")
    yield
    sessions.clear()
    print("👋 DataClean OpenEnv API shut down.")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="DataClean OpenEnv API",
    description=(
        "OpenEnv-compatible REST API for the Intelligent Data Cleaning Environment. "
        "Provides endpoints for resetting episodes, stepping through actions, "
        "grading results, and running baseline inference agents."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Meta"])
def health_check():
    """Liveness probe used by Docker health checks."""
    return {"status": "ok", "active_sessions": len(sessions)}

# ── Tasks ─────────────────────────────────────────────────────────────────────
@app.get("/tasks", tags=["Environment"])
def list_tasks() -> Dict[str, List[str]]:
    """Return the list of registered task names."""
    return {"tasks": list(TASKS.keys())}

# ── Reset ─────────────────────────────────────────────────────────────────────
@app.post("/env/reset", response_model=Dict[str, Any], tags=["Environment"])
def reset_env(task_name: str = "easy"):
    """Initialise a new episode for the given task and return a session_id + observation."""
    if task_name not in TASKS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid task '{task_name}'. Valid options: {list(TASKS.keys())}"
        )
    session_id = str(uuid.uuid4())
    env = DataCleaningEnv(task_name=task_name)
    obs = env.reset()
    sessions[session_id] = env
    return {"session_id": session_id, "observation": obs.dict()}

# ── Step ──────────────────────────────────────────────────────────────────────
@app.post("/env/step/{session_id}", response_model=Dict[str, Any], tags=["Environment"])
def step_env(session_id: str, action: Action):
    """Apply an action to the environment and return the new observation, reward, and done flag."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found. Call /env/reset first.")
    env = sessions[session_id]
    obs, reward_val, done, info = env.step(action)
    return {
        "observation": obs.dict(),
        "reward": {"reward": reward_val, "reason": info.get("msg", "")},
        "done": done,
        "info": info,
    }

# ── State ─────────────────────────────────────────────────────────────────────
@app.get("/env/state/{session_id}", response_model=Observation, tags=["Environment"])
def state_env(session_id: str):
    """Return the current observation without advancing the episode."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    return sessions[session_id].state()

# ── Grader ────────────────────────────────────────────────────────────────────
@app.get("/grader/{session_id}", tags=["Grading"])
def run_grader(session_id: str):
    """Run the deterministic grader and return a score in [0.0, 1.0]."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    env = sessions[session_id]
    score = grade_episode(env)
    return {"session_id": session_id, "score": score, "steps_taken": env.step_count}

# ── Baseline ──────────────────────────────────────────────────────────────────
@app.post("/baseline", tags=["Baseline"])
def run_baseline(task_name: str = "easy"):
    """
    Run the baseline inference agent (rule-based or GPT-backed) on the given task.
    Returns the full step history and final graded score.
    """
    if task_name not in TASKS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid task '{task_name}'. Valid options: {list(TASKS.keys())}"
        )
    try:
        from baseline_inference import run_baseline_inference
        result = run_baseline_inference(task_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
