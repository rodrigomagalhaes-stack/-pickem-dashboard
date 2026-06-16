import KPICards from './KPICards'
import DistributionTable from './DistributionTable'

function fmtBRL(n) {
  return (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function aggregateDist(events) {
  if (!events.length) return []
  const noQ = Math.max(...events.map((e) => (e.dist?.length || 1) - 1))
  return Array.from({ length: noQ + 1 }, (_, i) => ({
    acertos: i,
    count: events.reduce((s, ev) => s + (ev.dist?.[i]?.count || 0), 0),
  }))
}

export default function OverviewTab({ events, onSelectEvent }) {
  if (!events.length) {
    return <div className="empty-state tab-content">Nenhum evento salvo ainda.</div>
  }

  const totalUsuarios = events.reduce((s, e) => s + (e.usuarios_unicos || 0), 0)
  const totalGanhadores = events.reduce((s, e) => s + (e.ganhadores || 0), 0)
  const totalPayout = events.reduce((s, e) => s + (e.payout || 0), 0)
  const mediaGeral = events.reduce((s, e) => s + (e.media_acertos || 0), 0) / events.length
  const premioMax = Math.max(...events.map((e) => e.premio_max || 0))

  const aggDist = aggregateDist(events)
  const thresholds = events.map((e) => e.win_threshold).filter((v) => v != null)
  const aggWinThreshold = thresholds.length ? Math.min(...thresholds) : null

  const consolidated = {
    totalEntradas: events.reduce((s, e) => s + (e.total_entradas || 0), 0),
    usuariosUnicos: totalUsuarios,
    ganhadores: totalGanhadores,
    mediaAcertos: mediaGeral,
    payout: totalPayout,
    premioMax,
    winThreshold: aggWinThreshold,
    noQuestions: aggDist.length - 1,
    dist: aggDist,
  }

  return (
    <div className="tab-content">
      <div className="overview-section">
        <h3 className="section-title">Consolidado — todos os eventos</h3>
        <KPICards meta={consolidated} />
        <DistributionTable
          dist={aggDist}
          winThreshold={aggWinThreshold}
          totalUsers={totalUsuarios}
        />
      </div>

      <div className="overview-section">
        <h3 className="section-title">Comparativo por evento</h3>
        <table className="cmp-table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Usuários</th>
              <th>Ganhadores</th>
              <th>Média acertos</th>
              <th>Payout</th>
              <th>Corte</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} onClick={() => onSelectEvent(ev.id)}>
                <td className="td-name">{ev.nome}</td>
                <td>{(ev.usuarios_unicos || 0).toLocaleString('pt-BR')}</td>
                <td>{ev.ganhadores}</td>
                <td>{(ev.media_acertos || 0).toFixed(2)}</td>
                <td>{fmtBRL(ev.payout)}</td>
                <td>{ev.win_threshold ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
