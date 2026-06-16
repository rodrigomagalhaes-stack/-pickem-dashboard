export default function DistributionTable({ dist, winThreshold, totalUsers }) {
  const total = dist.reduce((s, d) => s + d.count, 0) || totalUsers || 1

  return (
    <div className="table-wrap">
      <table className="dist-table">
        <thead>
          <tr>
            <th>Acertos</th>
            <th>Usuários</th>
            <th>%</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {[...dist].reverse().map((row) => {
            const isWinner = winThreshold != null && row.acertos >= winThreshold
            const pct = total > 0 ? ((row.count / total) * 100).toFixed(1) : '0.0'
            const isCutoff = row.acertos === winThreshold

            return (
              <tr
                key={row.acertos}
                className={isWinner ? 'row-winner' : ''}
              >
                <td>
                  {row.acertos}
                  {isCutoff && <span className="cutoff-badge">corte</span>}
                </td>
                <td>{row.count}</td>
                <td>{pct}%</td>
                <td>
                  <div className="bar-cell">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: isWinner ? '#19c37d' : '#333',
                      }}
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
