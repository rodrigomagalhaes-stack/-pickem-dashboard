import Papa from 'papaparse'

function parseDate(str) {
  // "11/06/2026, 01:31" → Date
  if (!str) return null
  const [datePart, timePart] = str.split(', ')
  if (!datePart) return null
  const [day, month, year] = datePart.split('/')
  return new Date(`${year}-${month}-${day}T${timePart || '00:00'}`)
}

function parsePrize(str) {
  if (!str) return 0
  return parseFloat(str.replace('BRL', '').trim()) || 0
}

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          resolve(processRows(data))
        } catch (e) {
          reject(e)
        }
      },
      error: reject,
    })
  })
}

export function processRows(rawRows) {
  // Filtrar test e restricted
  const rows = rawRows.filter(
    (r) => r['User Test']?.toLowerCase() !== 'true' && r['Restricted']?.toLowerCase() !== 'true'
  )

  const totalEntradas = rawRows.length
  const uniqueUsers = [...new Set(rows.map((r) => r['User External ID']))].length

  const noQuestions = rows.length > 0 ? Math.max(...rows.map((r) => parseInt(r['No. Questions']) || 8)) : 8

  const entries = rows.map((r) => {
    const acertos = r['Correct Picks'] !== '' && r['Correct Picks'] != null
      ? parseInt(r['Correct Picks'])
      : null
    return {
      data_aposta: parseDate(r['Timestamp']),
      user_external_id: r['User External ID'],
      is_test: r['User Test']?.toLowerCase() === 'true',
      is_restricted: r['Restricted']?.toLowerCase() === 'true',
      status: r['Status'],
      acertos,
      premio: parsePrize(r['Prize Value']),
    }
  })

  const winners = entries.filter((e) => e.status === 'WON')
  const ganhadores = winners.length

  // Linha de corte: menor nº de acertos entre os ganhadores
  const winThreshold = ganhadores > 0
    ? Math.min(...winners.map((e) => e.acertos).filter((a) => a != null))
    : null

  const payout = entries.reduce((sum, e) => sum + e.premio, 0)
  const premioMax = Math.max(...entries.map((e) => e.premio), 0)

  // Média de acertos (excluir PENDING)
  const comAcertos = entries.filter((e) => e.acertos != null)
  const mediaAcertos = comAcertos.length > 0
    ? comAcertos.reduce((s, e) => s + e.acertos, 0) / comAcertos.length
    : 0

  // Distribuição: 0..noQuestions
  const dist = Array.from({ length: noQuestions + 1 }, (_, i) => {
    const count = comAcertos.filter((e) => e.acertos === i).length
    return { acertos: i, count }
  })

  // Período
  const datas = entries.map((e) => e.data_aposta).filter(Boolean)
  const periodoInicio = datas.length ? new Date(Math.min(...datas)) : null
  const periodoFim = datas.length ? new Date(Math.max(...datas)) : null

  const fmtDate = (d) =>
    d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
  const periodoLabel = periodoInicio && periodoFim
    ? `${fmtDate(periodoInicio)} – ${fmtDate(periodoFim)}`
    : ''

  return {
    meta: {
      totalEntradas,
      usuariosUnicos: uniqueUsers,
      ganhadores,
      payout,
      mediaAcertos,
      winThreshold,
      premioMax,
      noQuestions,
      periodoInicio,
      periodoFim,
      periodoLabel,
      dist,
    },
    entries,
  }
}
