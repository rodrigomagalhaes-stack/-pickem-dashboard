export function downloadCSV(filename, rows, columns) {
  const header = columns.join(',')
  const body = rows.map((r) => columns.map((c) => `"${(r[c] ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
