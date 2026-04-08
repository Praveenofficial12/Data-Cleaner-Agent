import { useState } from 'react'
import { resetEnv, stepEnv, runGrader } from '../api'

const ACTIONS = [
  { type: 'remove_nulls',        icon: '🗑️', label: 'Remove Nulls'  },
  { type: 'fill_missing_values', icon: '✏️', label: 'Fill Missing'   },
  { type: 'drop_duplicates',     icon: '📋', label: 'Drop Dupes'     },
  { type: 'normalize_column',    icon: '📐', label: 'Normalize Col'  },
  { type: 'correct_data_type',   icon: '🔧', label: 'Fix Data Type'  },
  { type: 'no_op',               icon: '⏭️', label: 'No-Op'          },
]

const NEEDS_COL   = new Set(['fill_missing_values', 'normalize_column', 'correct_data_type'])
const NEEDS_FILL  = new Set(['fill_missing_values'])
const NEEDS_TYPE  = new Set(['correct_data_type'])

export default function TaskRunner() {
  const [taskName,    setTaskName]    = useState('easy')
  const [sessionId,   setSessionId]   = useState(null)
  const [observation, setObservation] = useState(null)
  const [log,         setLog]         = useState([])
  const [score,       setScore]       = useState(null)
  const [done,        setDone]        = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [selectedAct, setSelectedAct] = useState(null)
  const [colName,     setColName]     = useState('')
  const [fillVal,     setFillVal]     = useState('')
  const [tgtType,     setTgtType]     = useState('int')

  async function handleReset() {
    setLoading(true)
    const data = await resetEnv(taskName)
    setSessionId(data.session_id)
    setObservation(data.observation)
    setLog([])
    setScore(null)
    setDone(false)
    setSelectedAct(null)
    setLoading(false)
  }

  async function handleStep() {
    if (!selectedAct || !sessionId) return
    setLoading(true)
    const action = {
      action_type: selectedAct,
      ...(NEEDS_COL.has(selectedAct)  && colName  ? { column_name: colName }   : {}),
      ...(NEEDS_FILL.has(selectedAct) && fillVal   ? { fill_value:  fillVal }   : {}),
      ...(NEEDS_TYPE.has(selectedAct)              ? { target_type: tgtType }   : {}),
    }
    const res = await stepEnv(sessionId, action)
    setObservation(res.observation)
    setDone(res.done)
    setLog(prev => [{
      step: prev.length + 1,
      action: selectedAct,
      reward: res.reward?.reward ?? 0,
      msg: res.reward?.reason ?? res.info?.msg ?? ''
    }, ...prev])
    if (res.done) {
      const g = await runGrader(sessionId)
      setScore(g.score)
    }
    setLoading(false)
  }

  async function handleGrade() {
    if (!sessionId) return
    const g = await runGrader(sessionId)
    setScore(g.score)
  }

  const scoreColor = score === null ? '' : score >= 0.8 ? 'var(--accent-green)' : score >= 0.5 ? 'var(--accent-amber)' : 'var(--accent-red)'
  const cols = observation ? Object.keys(observation.column_data_types) : []

  return (
    <div className="task-runner">
      <h1 className="page-title"><span>Task Runner</span></h1>
      <p className="page-subtitle">Select a task, reset the environment, then step through actions to clean the dataset.</p>

      {/* Controls */}
      <div className="card">
        <div className="task-select-row">
          <select className="select-input" value={taskName} onChange={e => setTaskName(e.target.value)}>
            <option value="easy">🟢 Easy Task</option>
            <option value="medium">🟡 Medium Task</option>
            <option value="hard">🔴 Hard Task</option>
          </select>
          <button className="btn btn-primary" onClick={handleReset} disabled={loading}>
            {loading ? <span className="spinner" /> : '⚡'} Reset Environment
          </button>
          {sessionId && !done && (
            <button className="btn btn-secondary" onClick={handleGrade} disabled={loading}>🏆 Grade Now</button>
          )}
          {sessionId && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              Session: {sessionId.slice(0,8)}…
            </span>
          )}
        </div>
      </div>

      {observation && (
        <>
          {/* Observation */}
          <div className="card">
            <div className="card-title">📊 Current Observation</div>
            <div className="obs-grid">
              {[
                { label: 'Rows',         val: observation.num_rows,              color: 'color-blue'   },
                { label: 'Columns',      val: observation.num_cols,              color: 'color-cyan'   },
                { label: 'Missing',      val: observation.missing_values_count,  color: 'color-red'    },
                { label: 'Duplicates',   val: observation.duplicate_rows_count,  color: 'color-amber'  },
                { label: 'Consistency',  val: `${(observation.data_consistency_score * 100).toFixed(0)}%`, color: 'color-green' },
              ].map(o => (
                <div className="obs-item" key={o.label}>
                  <div className="obs-label">{o.label}</div>
                  <div className={`obs-value ${o.color}`}>{o.val}</div>
                </div>
              ))}
            </div>
            {/* Progress Bar */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <span>Data Cleanliness</span>
                <span>{(observation.data_consistency_score * 100).toFixed(0)}%</span>
              </div>
              <div className="progress-wrap">
                <div className="progress-bar" style={{ width: `${observation.data_consistency_score * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Column Types */}
          <div className="card">
            <div className="card-title">🗂️ Column Data Types</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {Object.entries(observation.column_data_types).map(([col, dtype]) => (
                <span key={col} className="badge bg-blue color-blue">{col}: <strong>{dtype}</strong></span>
              ))}
            </div>
          </div>

          {/* Action Panel */}
          {!done && (
            <div className="card">
              <div className="card-title">⚡ Choose Action</div>
              <div className="action-grid">
                {ACTIONS.map(a => (
                  <button
                    key={a.type}
                    className={`action-btn ${selectedAct === a.type ? 'selected' : ''}`}
                    onClick={() => setSelectedAct(a.type)}
                    disabled={loading}
                  >
                    <span className="action-icon">{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Extra params */}
              {selectedAct && NEEDS_COL.has(selectedAct) && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <select className="select-input" value={colName} onChange={e => setColName(e.target.value)}>
                    <option value="">— Select Column —</option>
                    {cols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {NEEDS_FILL.has(selectedAct) && (
                    <input className="text-input" placeholder="Fill value…" value={fillVal} onChange={e => setFillVal(e.target.value)} />
                  )}
                  {NEEDS_TYPE.has(selectedAct) && (
                    <select className="select-input" value={tgtType} onChange={e => setTgtType(e.target.value)}>
                      <option value="int">int</option>
                      <option value="float">float</option>
                      <option value="str">str</option>
                    </select>
                  )}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleStep}
                disabled={loading || !selectedAct}
                style={{ width: '100%' }}
              >
                {loading ? <><span className="spinner" /> Running…</> : '▶ Execute Action'}
              </button>
            </div>
          )}

          {/* Score */}
          {score !== null && (
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="card-title">🏆 Episode Score</div>
              <div style={{ fontSize: '4rem', fontWeight: 900, color: scoreColor, margin: '0.5rem 0' }}>
                {(score * 100).toFixed(0)}%
              </div>
              <div className="progress-wrap" style={{ maxWidth: 300, margin: '0 auto' }}>
                <div className="progress-bar" style={{ width: `${score * 100}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}aa)` }} />
              </div>
              {done && <div style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Episode complete · {log.length} steps taken</div>}
            </div>
          )}

          {/* Step Log */}
          {log.length > 0 && (
            <div className="card">
              <div className="card-title">📜 Step History</div>
              <div className="step-log">
                {log.map(entry => (
                  <div className="log-entry" key={entry.step}>
                    <span className="log-step">#{entry.step}</span>
                    <span className="log-action">{entry.action}</span>
                    <span className="log-msg">{entry.msg}</span>
                    <span className="log-reward" style={{ color: entry.reward >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {entry.reward >= 0 ? '+' : ''}{entry.reward.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!observation && (
        <div className="info-box">
          👆 Select a task and click <strong>Reset Environment</strong> to begin an episode.
        </div>
      )}
    </div>
  )
}
