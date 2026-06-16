export default function DistributionTable({ dist, winThreshold, totalUsers }) {
  const total = dist.reduce((s, d) => s + d.count, 0) || totalUsers || 1
  const maxCount = Math.max(...dist.map((d) => d.count), 1)

  return (
    <div className="table-wrap">
      <table className="dist-table">
        <thead>
          <tr>
            <th style={{ width: '140px' }}>Acertos</th>
            <th></th>
            <th style={{ width: '100px', textAlign: 'right' }}>Usuários</th>
            <th style={{ width: '70px', textAlign: 'right' }}>%</th>
          </tr>
        </thead>
        <tbody>
          {[...dist].reverse().map((row) => {
            const isWinner = winThreshold != null && row.acertos >= winThreshold
            const pct = total > 0 ? ((row.count / total) * 100).toFixed(1) : '0.0'
            const barPct = maxCount > 0 ? (row.count / maxCount) * 100 : 0
            const label = row.acertos === 1 ? '1 acerto' : `${row.acertos} acertos`

            return (
              <tr key={row.acertos} className={isWinner ? 'row-winner' : ''}>
                <td className="td-acertos">
                  {label}
                  {isWinner && <span className="check">✓</span>}
                </td>
                <td className="td-bar">
                  <div className="bar-bg">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${barPct}%`,
                        background: isWinner ? '#19c37d' : '#2d4a3e',
                      }}
                    />
                  </div>
                </td>
                <td className="td-num">{row.count.toLocaleString('pt-BR')}</td>
                <td className="td-pct">{pct}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
