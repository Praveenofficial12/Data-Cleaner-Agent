export default function Header({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'task',      label: '🤖 Task Runner' },
    { id: 'baseline',  label: '🚀 Baseline' },
  ]

  return (
    <header className="header">
      <div className="header-brand">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="url(#g1)"/>
          <path d="M7 10h14M7 14h10M7 18h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="21" cy="18" r="3" fill="#10b981"/>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="28" y2="28">
              <stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/>
            </linearGradient>
          </defs>
        </svg>
        DataClean OpenEnv
      </div>
      <nav className="header-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
