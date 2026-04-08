# 🧹 DataClean OpenEnv

> **An OpenEnv-compatible reinforcement learning environment for training AI agents to clean and preprocess tabular datasets.**
> Built for the **Meta PyTorch OpenEnv Hackathon**.

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)
[![OpenEnv](https://img.shields.io/badge/OpenEnv-v1.0.0-orange)](./openenv.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
- [Environment Specification](#environment-specification)
  - [Observation Space](#observation-space)
  - [Action Space](#action-space)
  - [Reward Design](#reward-design)
  - [Tasks](#tasks)
- [API Reference](#api-reference)
- [Baseline Inference Agent](#baseline-inference-agent)
- [Grading System](#grading-system)
- [Frontend Dashboard](#frontend-dashboard)
- [Development Guide](#development-guide)

---

## 🎯 Overview

**DataClean OpenEnv** is a production-ready environment where an AI agent interacts with dirty datasets via a REST API, observing statistics and taking cleaning actions to maximise a deterministic quality score.

### Key Features

| Feature | Description |
|---|---|
| 🔄 **Sequential Decision-Making** | Agent takes up to 20 steps per episode |
| 📊 **Rich Observations** | Missing values, duplicates, dtypes, summary statistics |
| ⚡ **6 Cleaning Actions** | remove_nulls, fill_missing, drop_duplicates, normalize, fix_dtype, no-op |
| 🏆 **Deterministic Grader** | Reproducible 0.0–1.0 score based on data quality |
| 🤖 **Dual Baseline** | Rule-based agent + GPT-3.5 Turbo (when API key available) |
| 🐳 **Dockerized** | Single `docker compose up` to launch everything |
| 🎨 **Live Dashboard** | React frontend with real-time task runner and baseline comparison |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DataClean OpenEnv                        │
│                                                             │
│   ┌──────────────┐    REST API    ┌──────────────────────┐  │
│   │   React UI   │ ◄────────────► │   FastAPI Backend    │  │
│   │  (Vite/SPA)  │                │                      │  │
│   │              │                │  ┌─────────────────┐ │  │
│   │  Dashboard   │                │  │ DataCleaningEnv │ │  │
│   │  TaskRunner  │                │  │  - reset()      │ │  │
│   │  Baseline    │                │  │  - step()       │ │  │
│   └──────────────┘                │  │  - state()      │ │  │
│         :3000                     │  └────────┬────────┘ │  │
│                                   │           │          │  │
│                                   │  ┌────────▼────────┐ │  │
│                                   │  │  Grader (0–1)   │ │  │
│                                   │  └─────────────────┘ │  │
│                                   │        :8000         │  │
│                                   └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
openenv-data-cleaner/
├── openenv.yaml              # OpenEnv manifest
├── docker-compose.yml        # Full-stack orchestration
├── .env.example              # Environment variable template
├── .gitignore
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── baseline_inference.py # Rule-based + OpenAI baseline agent
│   │
│   ├── api/
│   │   └── main.py           # FastAPI app (all endpoints)
│   │
│   ├── env/
│   │   └── environment.py    # DataCleaningEnv (reset/step/state)
│   │
│   ├── models/
│   │   └── schemas.py        # Pydantic Observation, Action, Reward
│   │
│   ├── graders/
│   │   └── grader.py         # Deterministic episode grader
│   │
│   └── tasks/
│       └── data_tasks.py     # Easy / Medium / Hard dataset generators
│
└── frontend/
    ├── Dockerfile
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── App.css
        ├── api.js             # Typed API client
        ├── main.jsx
        └── components/
            ├── Header.jsx
            ├── Dashboard.jsx  # Overview & stats
            ├── TaskRunner.jsx # Interactive step-by-step runner
            └── BaselineRunner.jsx # Automated agent comparison
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** and **pip**
- **Node.js 18+** and **npm**
- *(Optional)* Docker & Docker Compose for containerised deployment

### 1 — Clone & Configure

```bash
git clone <your-repo-url>
cd openenv-data-cleaner

# Copy and configure environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY (optional — fallback agent works without it)
```

### 2 — Start the Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate
# Activate (Linux/macOS)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn api.main:app --reload --port 8000
```

The backend will be available at **http://localhost:8000**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3 — Start the Frontend

```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

The frontend will be available at **http://localhost:5173**

---

## 🐳 Docker Deployment

Run the entire stack with a single command:

```bash
# From the project root
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

To pass your OpenAI key:

```bash
OPENAI_API_KEY=sk-... docker compose up --build
```

To stop:

```bash
docker compose down
```

---

## 📐 Environment Specification

### Observation Space

Each `GET /env/state/{session_id}` returns an `Observation` object:

```json
{
  "num_rows": 6,
  "num_cols": 3,
  "missing_values_count": 2,
  "duplicate_rows_count": 2,
  "data_consistency_score": 0.0,
  "column_data_types": {
    "id": "int64",
    "score": "float64",
    "category": "object"
  },
  "summary_statistics": {
    "score": { "mean": 87.5, "min": 85.0, "max": 92.0 }
  }
}
```

| Field | Type | Description |
|---|---|---|
| `num_rows` | int | Current row count after cleaning steps |
| `num_cols` | int | Number of columns |
| `missing_values_count` | int | Total NaN cells across all columns |
| `duplicate_rows_count` | int | Number of exact duplicate rows |
| `data_consistency_score` | float [0,1] | Progress score = 1 − (current_issues / initial_issues) |
| `column_data_types` | dict | `{column_name: dtype_string}` |
| `summary_statistics` | dict | Per-column `{mean, min, max}` for numeric columns |

### Action Space

Each `POST /env/step/{session_id}` accepts an `Action` object:

```json
{
  "action_type": "fill_missing_values",
  "column_name": "age",
  "fill_value": 25,
  "target_type": null
}
```

| `action_type` | Parameters | Description |
|---|---|---|
| `remove_nulls` | `column_name` (optional) | Drop rows with NaN (globally or per column) |
| `fill_missing_values` | `column_name` ✅, `fill_value` ✅ | Replace NaN with a specific value |
| `drop_duplicates` | — | Remove all duplicate rows |
| `normalize_column` | `column_name` ✅ | Min-max normalize a numeric column to [0, 1] |
| `correct_data_type` | `column_name` ✅, `target_type` ✅ | Cast column to `int`, `float`, or `str` |
| `no_op` | — | Take no action (ends reward loop) |

### Reward Design

```
+1.0 per data issue resolved   (missing value or duplicate row)
−1.0 per data issue introduced (action worsens the dataset)
−0.05 unnecessary step         (action taken when no issues remain)
−0.1  invalid action params    (missing column, bad fill value, etc.)
−1.0  action exception         (runtime error during step)
```

### Tasks

| Task | Issues | Description |
|---|---|---|
| **easy** | Missing values | 5-row dataset with 2 missing values across `age` and `income` |
| **medium** | Missing + duplicates | 6-row dataset with 2 NaN cells and 2 duplicate rows |
| **hard** | Missing + dupes + wrong types | 5-row dataset with numeric strings, currency formatting, NaNs, and duplicates |

---

## 🔌 API Reference

All endpoints are documented interactively at **http://localhost:8000/docs**.

### `GET /tasks`
Returns list of available task names.
```json
{ "tasks": ["easy", "medium", "hard"] }
```

### `POST /env/reset?task_name={task}`
Initialises a new episode. Returns a `session_id` and initial `observation`.
```json
{
  "session_id": "3f8a1b2c-...",
  "observation": { ... }
}
```

### `POST /env/step/{session_id}`
Applies an action. Returns updated observation, reward, done flag and info.
```json
{
  "observation": { ... },
  "reward": { "reward": 2.0, "reason": "Dropped duplicates." },
  "done": false,
  "info": { "msg": "Dropped duplicates." }
}
```

### `GET /env/state/{session_id}`
Returns current observation without advancing the episode.

### `GET /grader/{session_id}`
Runs the deterministic grader and returns a final score.
```json
{ "session_id": "...", "score": 0.85, "steps_taken": 3 }
```

### `POST /baseline?task_name={task}`
Runs the full baseline agent and returns the complete step history + score.
```json
{
  "task": "medium",
  "score": 0.7,
  "steps_taken": 2,
  "history": [ ... ]
}
```

---

## 🤖 Baseline Inference Agent

The baseline agent (`backend/baseline_inference.py`) supports two modes:

### Rule-Based (No API Key Required)
A deterministic heuristic agent that always:
1. Drops duplicates (if any)
2. Removes nulls (if any)
3. Calls no-op (episode end)

### GPT-3.5 Turbo (Requires `OPENAI_API_KEY`)
Uses the OpenAI Chat API to observe the current state JSON and choose the best action via structured JSON output. Automatically falls back to the rule-based agent on API failure.

```bash
# Run baseline directly
cd backend
python baseline_inference.py
```

---

## 🏆 Grading System

The deterministic grader (`backend/graders/grader.py`) evaluates the final state of the dataset:

| Penalty | Trigger | Max Deduction |
|---|---|---|
| −0.4 | Remaining missing values | 0.1 per cell |
| −0.3 | Remaining duplicate rows | 0.1 per row |
| −0.1 | Numeric data stuck in object dtype | per column |
| −0.2 | Excessive steps (> 10) | 0.02 per extra step |

**Score = `max(0.0, 1.0 − Σ penalties)`**

A perfect agent that cleans all data in ≤ 10 steps scores **1.0**.

---

## 🎨 Frontend Dashboard

The React dashboard provides three views:

### 📊 Dashboard
Overview of environment specs: task descriptions, action space, reward design, and live task list fetched from the backend.

### 🤖 Task Runner
Interactive episode runner:
- Select Easy / Medium / Hard task
- Click **Reset Environment** to start a session
- Choose an action (and optional parameters) then **Execute**
- Watch the observation update, rewards accumulate, and the step log grow
- Click **Grade Now** at any point for an intermediate score

### 🚀 Baseline Runner
Automated agent comparison:
- Run any task individually or **Run All Tasks** at once
- See the final score, steps taken, and full step-by-step log
- Works with the rule-based agent by default; uses GPT when `OPENAI_API_KEY` is set

---

## 🛠️ Development Guide

### Running Tests

```bash
cd backend
# Install test deps (if added)
pip install pytest pytest-asyncio httpx

# Run unit tests
pytest
```

### Adding a New Task

1. Open `backend/tasks/data_tasks.py`
2. Add a new `create_<name>_task()` function returning a `pd.DataFrame`
3. Register it in the `TASKS` dict
4. Add the task to `openenv.yaml`

### Adding a New Action

1. Open `backend/env/environment.py` → `step()` method
2. Add a new `elif action.action_type == '<new_action>':` branch
3. Update `backend/models/schemas.py` if new parameters are needed
4. Add the action to the frontend action grids in `TaskRunner.jsx` and `Dashboard.jsx`

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | No | `""` | Enables GPT-3.5 Turbo baseline mode |

---

## 📄 License

MIT © OpenEnv Hackathon Team

---

<div align="center">
  <strong>Built for the Meta PyTorch OpenEnv Hackathon 🏆</strong><br/>
  <em>Train smarter agents. Build cleaner data pipelines.</em>
</div>
