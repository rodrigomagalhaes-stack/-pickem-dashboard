function fmt(n, decimals = 0) {
  if (n == null) return '–'
  return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtBRL(n) {
  if (n == null) return '–'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function KPICards({ meta }) {
  const cards = [
    { label: 'Usuários únicos', value: fmt(meta.usuariosUnicos) },
    { label: 'Ganhadores', value: fmt(meta.ganhadores), accent: true },
    { label: 'Taxa de acerto', value: meta.usuariosUnicos ? `${fmt((meta.ganhadores / meta.usuariosUnicos) * 100, 1)}%` : '–' },
    { label: 'Média de acertos', value: fmt(meta.mediaAcertos, 2) },
    { label: 'Payout total', value: fmtBRL(meta.payout) },
    { label: 'Prêmio máximo', value: fmtBRL(meta.premioMax) },
    { label: 'Linha de corte', value: meta.winThreshold != null ? `${meta.winThreshold} acertos` : '–', accent: true },
    { label: 'Período', value: meta.periodoLabel || '–', wide: true },
  ]

  return (
    <div className="kpi-grid">
      {cards.map((c) => (
        <div key={c.label} className={`kpi-card${c.wide ? ' kpi-wide' : ''}`}>
          <span className="kpi-label">{c.label}</span>
          <span className={`kpi-value${c.accent ? ' kpi-accent' : ''}`}>{c.value}</span>
        </div>
      ))}
    </div>
  )
}
