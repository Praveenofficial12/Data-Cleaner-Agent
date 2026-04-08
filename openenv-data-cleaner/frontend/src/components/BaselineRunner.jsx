import { useState } from 'react'
import { runBaseline } from '../api'

export default function BaselineRunner() {
  const [results, setResults]  = useState({})
  const [loading, setLoading]  = useState({})

  async function handleRun(task) {
    setLoading(prev => ({ ...prev, [task]: true }))
    try {
      const data = await runBaseline(task)
      setResults(prev => ({ ...prev, [task]: data }))
    } catch (e) {
      setResults(prev => ({ ...prev, [task]: { error: e.message } }))
    }
    setLoading(prev => ({ ...prev, [task]: false }))
  }

  async function handleRunAll() {
    for (const t of ['easy', 'medium', 'hard']) await handleRun(t)
  }

  const taskMeta = [
    { name: 'easy',   label: 'Easy',   icon: '🟢', color: 'color-green', bg: 'bg-green' },
    { name: 'medium', label: 'Medium', icon: '🟡', color: 'color-amber', bg: 'bg-amber' },
    { name: 'hard',   label: 'Hard',   icon: '🔴', color: 'color-red',   bg: 'bg-red'   },
  ]

  const scoreColor = v => v >= 0.8 ? 'var(--accent-green)' : v >= 0.5 ? 'var(--accent-amber)' : 'var(--accent-red)'

  return (
    <div className="task-runner">
      <h1 className="page-title"><span>Baseline Inference</span></h1>
      <p className="page-subtitle">
        Run the rule-based agent (or OpenAI GPT agent if <code style={{ background: 'var(--bg-card)', padding: '0 6px', borderRadius: 4 }}>OPENAI_API_KEY</code> is set) and compare deterministic scores across all tasks.
      </p>

      <div className="card">
        <div className="info-box" style={{ marginBottom: '1.25rem' }}>
          <strong style={{ color: 'var(--accent-blue)' }}>How it works:</strong> The baseline agent observes the environment state and applies rule-based logic (drop duplicates → remove nulls → no-op) or delegates to GPT-3.5 Turbo when an API key is available.
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleRunAll} disabled={Object.values(loading).some(Boolean)}>
          {Object.values(loading).some(Boolean) ? <><span className="spinner" /> Running all tasks…</> : '🚀 Run All Tasks'}
        </button>
      </div>

      <div className="baseline-results">
        {taskMeta.map(t => {
          const r = results[t.name]
          const isLoading = loading[t.name]
          return (
            <div className="card" key={t.name}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{t.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{t.label} Task</span>
                  <span className={`badge ${t.bg} ${t.color}`}>{t.name}</span>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleRun(t.name)}
                  disabled={isLoading}
                >
                  {isLoading ? <span className="spinner" /> : '▶ Run'}
                </button>
              </div>

              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <span className="spinner" /> Running agent…
                </div>
              )}

              {r && !r.error && (
                <>
                  {/* Score Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div>
                      <div className="card-title">Final Score</div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: scoreColor(r.score) }}>
                        {(r.score * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="card-title">Steps Taken</div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{r.steps_taken}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="progress-wrap">
                        <div className="progress-bar" style={{ width: `${r.score * 100}%`, background: `linear-gradient(90deg,${scoreColor(r.score)},${scoreColor(r.score)}aa)` }} />
                      </div>
                    </div>
                  </div>

                  {/* Step History */}
                  {r.history?.length > 0 && (
                    <div>
                      <div className="card-title" style={{ marginBottom: '0.5rem' }}>Agent Step Log</div>
                      <div className="step-log">
                        {r.history.map((h, i) => (
                          <div className="log-entry" key={i}>
                            <span className="log-step">#{i + 1}</span>
                            <span className="log-action">{h.action.action_type}</span>
                            <span className="log-msg">{h.info?.msg || ''}</span>
                            <span className="log-reward" style={{ color: h.reward >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                              {h.reward >= 0 ? '+' : ''}{h.reward.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {r?.error && (
                <div style={{ color: 'var(--accent-red)', fontSize: '0.875rem' }}>
                  ⚠️ Error: {r.error}
                </div>
              )}

              {!r && !isLoading && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Click ▶ Run to execute this task.</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
