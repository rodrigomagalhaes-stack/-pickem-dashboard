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

  const aggDist = aggregateDist(events)
  const aggWinThreshold = Math.min(...events.map((e) => e.win_threshold).filter((v) => v != null))

  const consolidated = {
    usuariosUnicos: totalUsuarios,
    ganhadores: totalGanhadores,
    mediaAcertos: mediaGeral,
    payout: totalPayout,
    premioMax: Math.max(...events.map((e) => e.premio_max || 0)),
    winThreshold: isFinite(aggWinThreshold) ? aggWinThreshold : null,
    periodoLabel: `${events.length} evento(s)`,
    dist: aggDist,
  }

  return (
    <div className="tab-content">
      <h2 className="section-title">Consolidado — todos os eventos</h2>
      <KPICards meta={consolidated} />

      <h3 className="section-subtitle">Distribuição agregada</h3>
      <DistributionTable
        dist={aggDist}
        winThreshold={isFinite(aggWinThreshold) ? aggWinThreshold : null}
        totalUsers={totalUsuarios}
      />

      <h3 className="section-subtitle">Comparativo por evento</h3>
      <div className="table-wrap">
        <table className="dist-table">
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
              <tr
                key={ev.id}
                className="row-clickable"
                onClick={() => onSelectEvent(ev.id)}
              >
                <td className="td-accent">{ev.nome}</td>
                <td>{ev.usuarios_unicos}</td>
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
