export function fmtBRL(n) {
  return 'R$ ' + (n || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseDateBR(s) {
  if (!s) return null
  const [d, m, y] = s.split('/').map(Number)
  return new Date(y, m - 1, d)
}

export function periodLabel(start, end) {
  const [d, m] = start.split('/')
  return `${d}/${m} – ${end}`
}
