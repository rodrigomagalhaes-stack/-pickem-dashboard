import { useState } from 'react'
import EventTab from './components/EventTab'
import OverviewTab from './components/OverviewTab'
import { useEvents } from './hooks/useEvents'

export default function App() {
  const [tab, setTab] = useState('event')
  const { events, loading, connected, saveEvent, deleteEvent, fetchEntries, fetchAllUserEvents, updateEventPrizeModel, renameEvent, setEventPago } = useEvents()
  const [highlightId, setHighlightId] = useState(null)

  function handleSelectFromOverview(id) {
    setHighlightId(id)
    setTab('event')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="eb-badge">EB</div>
          <div className="header-titles">
            <span className="logo">Pick'em / Predictor</span>
            <span className="brand-tag">Esportiva Bet</span>
          </div>
        </div>
        <div className="header-right">
          <span className="status-local">
            <span className="dot" style={{ background: '#555' }} />
            Local
          </span>
          <button className="btn-banco">
            <span>⚙</span> Banco
            <span className="dot" style={{ background: connected ? '#19c37d' : '#555', marginLeft: 6 }} />
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button className={`tab-btn${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>
          Visão Geral
        </button>
        <button className={`tab-btn${tab === 'event' ? ' active' : ''}`} onClick={() => setTab('event')}>
          Por Evento
        </button>
      </nav>

      {loading && <div className="loading-bar" />}

      {tab === 'event' && (
        <EventTab
          events={events}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onFetchEntries={fetchEntries}
          onUpdatePrizeModel={updateEventPrizeModel}
          onRename={renameEvent}
          onSetPago={setEventPago}
          highlightId={highlightId}
          onClearHighlight={() => setHighlightId(null)}
        />
      )}
      {tab === 'overview' && (
        <OverviewTab
          events={events}
          onSelectEvent={handleSelectFromOverview}
          onFetchAllUserEvents={fetchAllUserEvents}
        />
      )}
    </div>
  )
}
