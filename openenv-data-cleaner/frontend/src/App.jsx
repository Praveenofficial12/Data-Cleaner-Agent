import { useState } from 'react'
import Dashboard from './components/Dashboard'
import TaskRunner from './components/TaskRunner'
import BaselineRunner from './components/BaselineRunner'
import Header from './components/Header'
import './App.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="app-root">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'task' && <TaskRunner />}
        {activeTab === 'baseline' && <BaselineRunner />}
      </main>
    </div>
  )
}
