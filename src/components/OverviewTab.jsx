import { PRIZE_MODELS } from '../lib/prizeModels'
import KPICards from './KPICards'

function fmtBRL(n) {
  if (n == null || n === 0) return '–'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtNum(n) {
  return (n || 0).toLocaleString('pt-BR')
}
function fmtPct(n) {
  return n.toFixed(2).replace('.', ',') + '%'
}

export default function OverviewTab({ events, onSelectEvent }) {
  if (!events.length) {
    return <div className="empty-state tab-content">Nenhum evento salvo ainda.</div>
  }

  // ── Consolidado ────────────────────────────────────────────────────────────
  const totalUsuarios  = events.reduce((s, e) => s + (e.usuarios_unicos || 0), 0)
  const totalGanhadores = events.reduce((s, e) => s + (e.ganhadores || 0), 0)
  const totalPayout    = events.reduce((s, e) => s + (e.payout || 0), 0)
  const mediaGeral     = events.reduce((s, e) => s + (e.media_acertos || 0), 0) / events.length
  const premioMax      = Math.max(...events.map((e) => e.premio_max || 0))
  const thresholds     = events.map((e) => e.win_threshold).filter((v) => v != null)

  const consolidated = {
    totalEntradas: events.reduce((s, e) => s + (e.total_entradas || 0), 0),
    usuariosUnicos: totalUsuarios,
    ganhadores: totalGanhadores,
    mediaAcertos: mediaGeral,
    payout: totalPayout,
    premioMax,
    winThreshold: thresholds.length ? Math.min(...thresholds) : null,
    noQuestions: 8,
  }

  // ── Métricas por evento ────────────────────────────────────────────────────
  const rows = events.map((ev) => {
    const taxa = ev.usuarios_unicos > 0 ? (ev.ganhadores / ev.usuarios_unicos) * 100 : 0
    const premioPorGanhador = ev.ganhadores > 0 ? ev.payout / ev.ganhadores : null
    const modelo = ev.prize_model ? PRIZE_MODELS[ev.prize_model]?.label : null
    return { ev, taxa, premioPorGanhador, modelo }
  })

  // máximos para destacar
  const maxUsuarios  = Math.max(...rows.map((r) => r.ev.usuarios_unicos || 0))
  const maxGanhadores = Math.max(...rows.map((r) => r.ev.ganhadores || 0))
  const maxTaxa      = Math.max(...rows.map((r) => r.taxa))
  const maxPayout    = Math.max(...rows.map((r) => r.ev.payout || 0))
  const maxMedia     = Math.max(...rows.map((r) => r.ev.media_acertos || 0))

  return (
    <div className="tab-content">

      {/* KPIs consolidados */}
      <div className="overview-section">
        <h3 className="section-title">Consolidado — {events.length} evento{events.length > 1 ? 's' : ''}</h3>
        <KPICards meta={consolidated} />
      </div>

      {/* Tabela comparativa */}
      <div className="overview-section">
        <h3 className="section-title">Comparativo por evento</h3>
        <p className="section-hint">Clique num evento para abri-lo. Valores em verde são os maiores da coluna.</p>
        <div className="table-wrap">
          <table className="cmp-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Período</th>
                <th style={{ textAlign: 'right' }}>Usuários</th>
                <th style={{ textAlign: 'right' }}>Ganhadores</th>
                <th>Taxa (%)</th>
                <th style={{ textAlign: 'right' }}>Corte</th>
                <th style={{ textAlign: 'right' }}>Média acertos</th>
                <th style={{ textAlign: 'right' }}>Payout</th>
                <th style={{ textAlign: 'right' }}>Prêmio/ganhador</th>
                <th>Modelo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ ev, taxa, premioPorGanhador, modelo }) => (
                <tr key={ev.id} className="row-clickable" onClick={() => onSelectEvent(ev.id)}>
                  <td className="td-name">{ev.nome}</td>
                  <td className="td-periodo">{ev.periodo_label || '–'}</td>
                  <td className={`td-right${ev.usuarios_unicos === maxUsuarios ? ' td-best' : ''}`}>
                    {fmtNum(ev.usuarios_unicos)}
                  </td>
                  <td className={`td-right${ev.ganhadores === maxGanhadores && maxGanhadores > 0 ? ' td-best' : ''}`}>
                    {ev.ganhadores}
                  </td>
                  <td className="td-taxa">
                    <div className="taxa-wrap">
                      <span className={taxa === maxTaxa && maxTaxa > 0 ? 'td-best' : ''}>
                        {fmtPct(taxa)}
                      </span>
                      <div className="taxa-bar-bg">
                        <div
                          className="taxa-bar-fill"
                          style={{ width: maxTaxa > 0 ? `${(taxa / maxTaxa) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="td-right">{ev.win_threshold != null ? `${ev.win_threshold}+` : '–'}</td>
                  <td className={`td-right${ev.media_acertos === maxMedia ? ' td-best' : ''}`}>
                    {(ev.media_acertos || 0).toFixed(2)}
                  </td>
                  <td className={`td-right${ev.payout === maxPayout && maxPayout > 0 ? ' td-best' : ''}`}>
                    {fmtBRL(ev.payout)}
                  </td>
                  <td className="td-right">{fmtBRL(premioPorGanhador)}</td>
                  <td className="td-modelo">{modelo || <span style={{ color: '#444' }}>–</span>}</td>
                </tr>
              ))}
            </tbody>
            {events.length > 1 && (
              <tfoot>
                <tr className="row-total">
                  <td><strong>Total</strong></td>
                  <td className="td-periodo" style={{ color: '#555' }}>{events.length} eventos</td>
                  <td className="td-right"><strong>{fmtNum(totalUsuarios)}</strong></td>
                  <td className="td-right"><strong>{totalGanhadores}</strong></td>
                  <td className="td-taxa">
                    <span style={{ fontSize: 12, color: '#888' }}>
                      {totalUsuarios > 0 ? fmtPct((totalGanhadores / totalUsuarios) * 100) : '–'}
                    </span>
                  </td>
                  <td className="td-right">–</td>
                  <td className="td-right"><strong>{mediaGeral.toFixed(2)}</strong></td>
                  <td className="td-right"><strong>{fmtBRL(totalPayout)}</strong></td>
                  <td className="td-right">{totalGanhadores > 0 ? fmtBRL(totalPayout / totalGanhadores) : '–'}</td>
                  <td>–</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
