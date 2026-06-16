import { useState, useRef } from 'react'
import { parseCSV } from '../lib/parseCSV'
import KPICards from './KPICards'
import DistributionTable from './DistributionTable'

export default function EventTab({ events, onSave, onDelete, highlightId, onClearHighlight }) {
  const [parsed, setParsed] = useState(null)
  const [selectedId, setSelectedId] = useState(highlightId || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  const selectedEvent = events.find((e) => e.id === selectedId)

  async function handleFile(file) {
    if (!file) return
    setError('')
    setParsed(null)
    try {
      const result = await parseCSV(file)
      setParsed(result)
      setSelectedId('')
    } catch (e) {
      setError('Erro ao processar CSV: ' + e.message)
    }
  }

  async function handleSave() {
    if (!parsed) return
    const nome = prompt('Nome do evento (ex: Brasil x Marrocos):')
    if (!nome?.trim()) return
    setSaving(true)
    setError('')
    try {
      await onSave(nome.trim(), parsed.meta, parsed.entries)
      setParsed(null)
    } catch (e) {
      setError('Erro ao salvar: ' + e.message)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!confirm(`Excluir evento "${selectedEvent?.nome}"?`)) return
    try {
      await onDelete(selectedId)
      setSelectedId('')
    } catch (e) {
      setError('Erro ao excluir: ' + e.message)
    }
  }

  const displayMeta = parsed
    ? parsed.meta
    : selectedEvent
    ? {
        usuariosUnicos: selectedEvent.usuarios_unicos,
        ganhadores: selectedEvent.ganhadores,
        mediaAcertos: selectedEvent.media_acertos,
        payout: selectedEvent.payout,
        premioMax: selectedEvent.premio_max,
        winThreshold: selectedEvent.win_threshold,
        periodoLabel: selectedEvent.periodo_label,
        dist: selectedEvent.dist,
      }
    : null

  return (
    <div className="tab-content">
      <div className="row-spaced">
        {/* Upload */}
        <div
          className={`drop-zone${dragging ? ' dragging' : ''}`}
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <span>Arraste um CSV ou <u>clique para selecionar</u></span>
        </div>

        {/* Seletor de eventos salvos */}
        <div className="event-selector">
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setParsed(null) }}
          >
            <option value="">— Selecionar evento salvo —</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.nome}</option>
            ))}
          </select>
          {selectedId && (
            <button className="btn-danger" onClick={handleDelete}>Excluir</button>
          )}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {parsed && (
        <div className="parsed-banner">
          <span>CSV carregado: <strong>{parsed.meta.usuariosUnicos}</strong> usuários únicos (filtrados)</span>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar evento'}
          </button>
        </div>
      )}

      {displayMeta && (
        <>
          <h2 className="section-title">
            {parsed ? 'Pré-visualização' : selectedEvent?.nome}
          </h2>
          <KPICards meta={displayMeta} />
          <h3 className="section-subtitle">Distribuição de acertos</h3>
          <DistributionTable
            dist={displayMeta.dist}
            winThreshold={displayMeta.winThreshold}
            totalUsers={displayMeta.usuariosUnicos}
          />
        </>
      )}

      {!displayMeta && (
        <div className="empty-state">
          Suba um CSV ou selecione um evento salvo para começar.
        </div>
      )}
    </div>
  )
}
