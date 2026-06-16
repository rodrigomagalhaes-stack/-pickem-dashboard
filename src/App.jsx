import { useState } from 'react'
import StatusIndicator from './components/StatusIndicator'
import EventTab from './components/EventTab'
import OverviewTab from './components/OverviewTab'
import { useEvents } from './hooks/useEvents'

export default function App() {
  const [tab, setTab] = useState('event')
  const [highlightId, setHighlightId] = useState(null)
  const { events, loading, connected, saveEvent, deleteEvent } = useEvents()

  function handleSelectFromOverview(id) {
    setHighlightId(id)
    setTab('event')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">Pick'em Dashboard</span>
          <span className="brand-tag">Esportiva Bet</span>
        </div>
        <StatusIndicator connected={connected} />
      </header>

      <nav className="tabs">
        <button
          className={`tab-btn${tab === 'event' ? ' active' : ''}`}
          onClick={() => setTab('event')}
        >
          Por Evento
        </button>
        <button
          className={`tab-btn${tab === 'overview' ? ' active' : ''}`}
          onClick={() => setTab('overview')}
        >
          Visão Geral
          {events.length > 0 && <span className="badge">{events.length}</span>}
        </button>
      </nav>

      {loading && <div className="loading-bar" />}

      {tab === 'event' && (
        <EventTab
          events={events}
          onSave={saveEvent}
          onDelete={deleteEvent}
          highlightId={highlightId}
          onClearHighlight={() => setHighlightId(null)}
        />
      )}
      {tab === 'overview' && (
        <OverviewTab events={events} onSelectEvent={handleSelectFromOverview} />
      )}
    </div>
  )
}
