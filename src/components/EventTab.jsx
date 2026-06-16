import { useState, useRef, useEffect } from 'react'
import { parseCSV } from '../lib/parseCSV'
import { PRIZE_MODELS } from '../lib/prizeModels'
import KPICards from './KPICards'
import DistributionTable from './DistributionTable'

export default function EventTab({ events, onSave, onDelete, onFetchEntries, onUpdatePrizeModel, highlightId }) {
  const [parsed, setParsed] = useState(null)
  const [selectedId, setSelectedId] = useState(highlightId || '')

  useEffect(() => {
    if (highlightId) { setSelectedId(highlightId); setParsed(null) }
  }, [highlightId])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [prizeModelKey, setPrizeModelKey] = useState('')

  // Carrega o modelo do evento selecionado
  useEffect(() => {
    const ev = events.find((e) => e.id === selectedId)
    setPrizeModelKey(ev?.prize_model || '')
  }, [selectedId, events])

  function handlePrizeModel(key) {
    setPrizeModelKey(key)
    if (selectedId) onUpdatePrizeModel(selectedId, key)
  }
  const fileRef = useRef()

  const selectedEvent = events.find((e) => e.id === selectedId)

  async function handleFile(file) {
    if (!file) return
    setError('')
    setParsed(null)
    setSelectedId('')
    try {
      const result = await parseCSV(file)
      setParsed(result)
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
      const ev = await onSave(nome.trim(), parsed.meta, parsed.entries)
      setSelectedId(ev.id)
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

  async function handleFetchEntries(acertos) {
    if (!selectedId) return []
    return onFetchEntries(selectedId, acertos)
  }

  const meta = parsed
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
        noQuestions: selectedEvent.dist ? selectedEvent.dist.length - 1 : 8,
        totalEntradas: selectedEvent.total_entradas,
        dist: selectedEvent.dist,
      }
    : null

  const prizeModel = prizeModelKey ? PRIZE_MODELS[prizeModelKey] : null
  const isSaved = !parsed && !!selectedEvent

  return (
    <div className="tab-content">
      {error && <div className="error-msg">{error}</div>}

      {/* Toolbar */}
      <div className="event-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-label">Evento:</span>
          <div className="toolbar-select-wrap">
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setParsed(null) }}
              className="toolbar-select"
            >
              {parsed && (
                <option value="">{`Evento — ${parsed.meta.periodoLabel} (não salvo)`}</option>
              )}
              {!parsed && <option value="">— Selecionar evento —</option>}
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.nome}</option>
              ))}
            </select>
          </div>

          {parsed && (
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          )}

          <button className="btn-outline" onClick={() => fileRef.current.click()}>
            Subir CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {(selectedId || parsed) && (
            <button
              className="btn-outline btn-outline-danger"
              onClick={selectedId ? handleDelete : () => setParsed(null)}
            >
              Excluir
            </button>
          )}
        </div>

        <div className="toolbar-right">
          {parsed && <span className="tag-local">grava local</span>}
          {isSaved && <span className="tag-saved">salvo</span>}
        </div>
      </div>

      {meta ? (
        <>
          <KPICards meta={meta} />

          <div className="dist-section">
            <div className="dist-header">
              <h3 className="dist-title">Usuários por nº de acertos</h3>
              <div className="prize-selector">
                <span className="toolbar-label">Modelo de premiação:</span>
                <select
                  className="toolbar-select"
                  value={prizeModelKey}
                  onChange={(e) => handlePrizeModel(e.target.value)}
                  style={{ minWidth: 180 }}
                >
                  <option value="">— Sem modelo —</option>
                  {Object.entries(PRIZE_MODELS).map(([key, m]) => (
                    <option key={key} value={key}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <DistributionTable
              dist={meta.dist}
              winThreshold={meta.winThreshold}
              totalUsers={meta.usuariosUnicos}
              prizeModel={prizeModel}
              localEntries={parsed ? parsed.entries : null}
              onFetchEntries={selectedId ? handleFetchEntries : null}
            />
          </div>
        </>
      ) : (
        <div
          className="drop-zone-full"
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        >
          <span>Arraste um CSV ou <u>clique para selecionar</u></span>
        </div>
      )}
    </div>
  )
}
