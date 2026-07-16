// Deno port of src/lib/parseReport.js — kept intentionally in sync by hand.
// If the Infobrasil layout ever changes, update BOTH copies:
//   src/lib/parseReport.js        (web upload, runs in the browser)
//   supabase/functions/_shared/parseReport.ts   (Telegram bot, runs server-side)

export interface ParsedVendor {
  code: string
  name: string
  grossSales: number
  netSales: number
  commission: number
}

export interface ParsedReport {
  start: string
  end: string
  loja: 'COLCH' | 'COLTIM'
  type: 'quinzena' | 'carteira'
  vendors: ParsedVendor[]
}

export interface ParseError {
  error: string
}

function parseNum(s: string): number {
  if (!s) return 0
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
}

function parseDateBR(s: string): Date {
  const [d, m, y] = s.split('/').map(Number)
  return new Date(y, m - 1, d)
}

// Heuristic: real quinzenas span ~2 weeks. The "carteira pendente" export is
// always pulled with a much wider window (ex: 01/01 até o fim do mês
// corrente), so anything over 20 dias is treated as a carteira snapshot.
function guessReportType(start: string, end: string): 'quinzena' | 'carteira' {
  const days = (parseDateBR(end).getTime() - parseDateBR(start).getTime()) / (1000 * 60 * 60 * 24)
  return days > 20 ? 'carteira' : 'quinzena'
}

const NUM_LINE_RE = /^[\d.]+,\d{2}(\s+[\d.]+,\d{2}){6,7}\s*$/
const LOJA_RE = /\b(COLCH|COLTIM)\b/

export function parseReportText(text: string): ParsedReport | ParseError {
  const periodMatch = text.match(
    /PER[ÍI]ODO DE (\d{2}\/\d{2}\/\d{4})\s*AT[ÉE]\s*(\d{2}\/\d{2}\/\d{4})/i
  )
  if (!periodMatch) {
    return { error: 'Não encontrei o período ("PERÍODO DE ... ATÉ ...") no PDF.' }
  }
  const start = periodMatch[1]
  const end = periodMatch[2]

  const lojaMatch = text.match(LOJA_RE)
  const loja = lojaMatch ? (lojaMatch[1] as 'COLCH' | 'COLTIM') : null
  if (!loja) {
    return { error: 'Não identifiquei a loja (COLCH/COLTIM) no PDF.' }
  }
  const type = guessReportType(start, end)

  const parts = text.split(/VENDEDOR:\s*/).slice(1)
  if (parts.length === 0) {
    return { error: 'Não encontrei nenhum bloco "VENDEDOR:" no PDF.' }
  }

  const vendors: ParsedVendor[] = []
  for (const part of parts) {
    const headerMatch = part.match(/^(\d+)-([^\n\r]+)/)
    if (!headerMatch) continue
    const code = headerMatch[1]
    const name = headerMatch[2].trim()

    const lines = part.split('\n').map((l) => l.trim()).filter(Boolean)
    let subtotalLine: string | null = null
    for (let i = 1; i < lines.length; i++) {
      if (NUM_LINE_RE.test(lines[i])) {
        subtotalLine = lines[i]
        break
      }
    }
    if (!subtotalLine) continue

    const nums = subtotalLine.split(/\s+/).map(parseNum)
    vendors.push({
      code,
      name,
      grossSales: nums[0],
      netSales: nums[nums.length - 2],
      commission: nums[nums.length - 1],
    })
  }

  if (vendors.length === 0) {
    return {
      error:
        'O período foi identificado, mas nenhum vendedor foi reconhecido. Confira se o PDF é o relatório L2.3.28 completo.',
    }
  }

  return { start, end, loja, type, vendors }
}
