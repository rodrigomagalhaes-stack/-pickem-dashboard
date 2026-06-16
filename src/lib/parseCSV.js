import Papa from 'papaparse'

// ── Datas ────────────────────────────────────────────────────────────────────
function parseDateBR(str) {
  // "11/06/2026, 01:31" → Date
  if (!str) return null
  const [datePart, timePart] = str.split(', ')
  if (!datePart) return null
  const [day, month, year] = datePart.split('/')
  return new Date(`${year}-${month}-${day}T${timePart || '00:00'}`)
}

function parseDateISO(str) {
  // "2026-06-14T17:44:57.505Z" → Date
  if (!str) return null
  const d = new Date(str)
  return isNaN(d) ? null : d
}

// ── Prêmios ──────────────────────────────────────────────────────────────────
// Formato v1 (US): "BRL 888.89" → ponto é decimal
function parsePrizeUS(str) {
  if (!str) return 0
  return parseFloat(str.replace(/BRL/i, '').trim()) || 0
}

// Formato v2 (BR): "R$6.000" → ponto é milhar; "R$6.000,50" → vírgula é decimal
function parsePrizeBR(str) {
  if (!str) return 0
  let s = str.replace(/R\$/i, '').replace(/\s/g, '').trim()
  if (!s) return 0
  if (s.includes(',')) {
    // vírgula = decimal → remove pontos de milhar, troca vírgula por ponto
    s = s.replace(/\./g, '').replace(',', '.')
  } else {
    // sem vírgula → pontos são milhar
    s = s.replace(/\./g, '')
  }
  return parseFloat(s) || 0
}

// ── Detecção de formato ──────────────────────────────────────────────────────
function detectFormat(fields) {
  if (fields.includes('User External ID')) return 'v1'
  if (fields.includes('Pid') || fields.includes('Entry ts')) return 'v2'
  return 'v1'
}

// ── Normalização: cada formato → estrutura interna comum ─────────────────────
function normalizeRows(rawRows, format) {
  if (format === 'v2') {
    return rawRows.map((r) => {
      const cp = r['Correct picks']
      const acertos = cp !== '' && cp != null ? parseInt(cp) : null
      const premio = parsePrizeBR(r['Prize'])
      // Sem coluna Status: deriva. Sem acertos = PENDING; com prêmio = WON; senão LOST.
      const status = acertos == null ? 'PENDING' : premio > 0 ? 'WON' : 'LOST'
      return {
        data_aposta: parseDateISO(r['Entry ts']),
        user_external_id: r['Pid'] || r['Username'] || r['User ID'],
        is_test: false,
        is_restricted: false,
        status,
        acertos,
        premio,
        noQuestions: parseInt(r['No questions']) || 8,
      }
    })
  }

  // v1
  return rawRows.map((r) => {
    const cp = r['Correct Picks']
    const acertos = cp !== '' && cp != null ? parseInt(cp) : null
    return {
      data_aposta: parseDateBR(r['Timestamp']),
      user_external_id: r['User External ID'],
      is_test: r['User Test']?.toLowerCase() === 'true',
      is_restricted: r['Restricted']?.toLowerCase() === 'true',
      status: r['Status'],
      acertos,
      premio: parsePrizeUS(r['Prize Value']),
      noQuestions: parseInt(r['No. Questions']) || 8,
    }
  })
}

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        try {
          resolve(processRows(data, meta?.fields || []))
        } catch (e) {
          reject(e)
        }
      },
      error: reject,
    })
  })
}

export function processRows(rawRows, fields = []) {
  const format = detectFormat(fields.length ? fields : Object.keys(rawRows[0] || {}))
  const allEntries = normalizeRows(rawRows, format)

  // Filtrar test e restricted
  const entries = allEntries.filter((e) => !e.is_test && !e.is_restricted)

  const uniqueUsers = [...new Set(entries.map((e) => e.user_external_id))].length
  const totalEntradas = entries.length

  const noQuestions = entries.length > 0
    ? Math.max(...entries.map((e) => e.noQuestions || 8))
    : 8

  const winners = entries.filter((e) => e.status === 'WON')
  const ganhadores = winners.length

  // Linha de corte: menor nº de acertos entre os ganhadores
  const winnerPicks = winners.map((e) => e.acertos).filter((a) => a != null)
  const winThreshold = winnerPicks.length > 0 ? Math.min(...winnerPicks) : null

  const payout = entries.reduce((sum, e) => sum + e.premio, 0)
  const premioMax = Math.max(...entries.map((e) => e.premio), 0)

  // Média de acertos (excluir PENDING)
  const comAcertos = entries.filter((e) => e.acertos != null)
  const mediaAcertos = comAcertos.length > 0
    ? comAcertos.reduce((s, e) => s + e.acertos, 0) / comAcertos.length
    : 0

  // Distribuição: 0..noQuestions
  const dist = Array.from({ length: noQuestions + 1 }, (_, i) => ({
    acertos: i,
    count: comAcertos.filter((e) => e.acertos === i).length,
  }))

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
    // chaves alinhadas com o que saveEvent espera
    entries: entries.map((e) => ({
      data_aposta: e.data_aposta,
      user_external_id: e.user_external_id,
      is_test: e.is_test,
      is_restricted: e.is_restricted,
      status: e.status,
      acertos: e.acertos,
      premio: e.premio,
    })),
  }
}
