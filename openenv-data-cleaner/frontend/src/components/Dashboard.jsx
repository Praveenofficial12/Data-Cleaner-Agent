import { useEffect, useState } from 'react'
import { listTasks } from '../api'

const TASK_INFO = {
  easy:   { label: 'Easy',   color: 'color-green', bg: 'bg-green', desc: 'Dataset with only missing values. Goal: fill or remove nulls correctly.' },
  medium: { label: 'Medium', color: 'color-amber', bg: 'bg-amber', desc: 'Dataset with missing values + duplicates. Goal: clean both issues efficiently.' },
  hard:   { label: 'Hard',   color: 'color-red',   bg: 'bg-red',   desc: 'Multiple issues: nulls, duplicates, wrong data types. Full preprocessing pipeline.' },
}

const ACTIONS = [
  { type: 'remove_nulls',       icon: '🗑️', label: 'Remove Nulls' },
  { type: 'fill_missing_values',icon: '✏️', label: 'Fill Missing'  },
  { type: 'drop_duplicates',    icon: '📋', label: 'Drop Dupes'    },
  { type: 'normalize_column',   icon: '📐', label: 'Normalize Col' },
  { type: 'correct_data_type',  icon: '🔧', label: 'Fix Data Type' },
  { type: 'no_op',              icon: '⏭️', label: 'No-Op'         },
]

export default function Dashboard() {
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    listTasks().then(d => setTasks(d.tasks || [])).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="page-title">
        <span>Intelligent Data Cleaning</span> OpenEnv
      </h1>
      <p className="page-subtitle">
        An OpenEnv-compatible environment where an AI agent learns to clean datasets through sequential decision-making.
      </p>

      {/* Hero Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Environment Tasks', value: '3', color: 'color-blue',   icon: '📂' },
          { label: 'Available Actions', value: '6', color: 'color-cyan',   icon: '⚡' },
          { label: 'Max Steps/Episode', value: '20',color: 'color-purple', icon: '🔄' },
          { label: 'Score Range',   value: '0–1', color: 'color-green',    icon: '🏆' },
        ].map(s => (
          <div className="card" key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
            <div className="card-title">{s.label}</div>
            <div className={`card-value ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Task Cards */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>📂 Available Tasks</h2>
      <div className="three-col" style={{ marginBottom: '2rem' }}>
        {Object.entries(TASK_INFO).map(([key, info]) => (
          <div className="card" key={key}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{info.label} Task</span>
              <span className={`badge ${info.bg} ${info.color}`}>{key}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{info.desc}</p>
          </div>
        ))}
      </div>

      {/* Action Cards */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>⚡ Action Space</h2>
      <div className="dashboard-action-grid">
        {ACTIONS.map(a => (
          <div className="card" key={a.type} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{a.icon}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.label}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.type}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Reward Info */}
      <div className="info-box" style={{ marginTop: '2rem' }}>
        <strong style={{ color: 'var(--accent-blue)' }}>Reward Design: </strong>
        <span>+1.0 per issue fixed · −1.0 per issue introduced · −0.05 unnecessary step · −0.1 invalid action · Final grader score: 0.0 → 1.0</span>
      </div>
    </div>
  )
}
