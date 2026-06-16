import { downloadCSV } from '../lib/downloadCSV'

function fmtBRL(n) {
  if (n == null) return '–'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function DistributionTable({ dist, winThreshold, totalUsers, prizeModel, onFetchEntries, localEntries }) {
  const total = dist.reduce((s, d) => s + d.count, 0) || totalUsers || 1
  const maxCount = Math.max(...dist.map((d) => d.count), 1)
  const hasPrize = !!prizeModel

  // custo total do modelo selecionado
  const custoTotal = hasPrize
    ? dist.reduce((sum, row) => {
        const prize = prizeModel.prizes[row.acertos]
        return sum + (prize ? prize * row.count : 0)
      }, 0)
    : 0

  async function handleDownload(acertos) {
    let rows = []

    if (localEntries) {
      // CSV ainda não salvo — filtrar da memória
      rows = localEntries
        .filter((e) => e.acertos === acertos)
        .map((e) => ({
          user_external_id: e.user_external_id,
          acertos: e.acertos,
          status: e.status,
          premio: e.premio,
          data_aposta: e.data_aposta ? new Date(e.data_aposta).toLocaleString('pt-BR') : '',
        }))
    } else if (onFetchEntries) {
      rows = await onFetchEntries(acertos)
    }

    if (!rows.length) { alert('Nenhum registro encontrado.'); return }

    downloadCSV(
      `acertos_${acertos}.csv`,
      rows,
      ['user_external_id', 'acertos', 'status', 'premio', 'data_aposta']
    )
  }

  return (
    <div>
      <div className="table-wrap">
        <table className="dist-table">
          <thead>
            <tr>
              <th style={{ width: 130 }}>Acertos</th>
              <th></th>
              <th style={{ width: 90, textAlign: 'right' }}>Usuários</th>
              <th style={{ width: 60, textAlign: 'right' }}>%</th>
              {hasPrize && <th style={{ width: 130, textAlign: 'right' }}>Prêmio/jogador</th>}
              {hasPrize && <th style={{ width: 140, textAlign: 'right' }}>Custo total</th>}
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {[...dist].reverse().map((row) => {
              const isWinner = winThreshold != null && row.acertos >= winThreshold
              const pct = total > 0 ? ((row.count / total) * 100).toFixed(1) : '0.0'
              const barPct = maxCount > 0 ? (row.count / maxCount) * 100 : 0
              const label = row.acertos === 1 ? '1 acerto' : `${row.acertos} acertos`
              const prize = hasPrize ? prizeModel.prizes[row.acertos] : null
              const custoLinha = prize ? prize * row.count : null

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
                  {hasPrize && (
                    <td className="td-num" style={{ color: prize ? '#e8e8e8' : '#444' }}>
                      {prize ? fmtBRL(prize) : '–'}
                    </td>
                  )}
                  {hasPrize && (
                    <td className="td-num" style={{ color: custoLinha ? '#19c37d' : '#444', fontWeight: custoLinha ? 600 : 400 }}>
                      {custoLinha ? fmtBRL(custoLinha) : '–'}
                    </td>
                  )}
                  <td className="td-download">
                    {row.count > 0 && (
                      <button
                        className="btn-dl"
                        title={`Baixar IDs com ${label}`}
                        onClick={() => handleDownload(row.acertos)}
                      >
                        ↓
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {hasPrize && custoTotal > 0 && (
            <tfoot>
              <tr className="row-total">
                <td colSpan={4} style={{ textAlign: 'right', color: '#888', fontSize: 12 }}>
                  Custo total do evento ({prizeModel.label})
                </td>
                <td className="td-num" style={{ color: '#888' }}></td>
                <td className="td-num" style={{ color: '#19c37d', fontWeight: 700, fontSize: 15 }}>
                  {fmtBRL(custoTotal)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
