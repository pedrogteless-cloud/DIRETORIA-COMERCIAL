// Parses the raw text of the Infobrasil report "L2.3.28 - Listagem de
// Comissão por Vendedor" into a structured period + vendor list.
//
// Format reference (one block per vendedor):
//   VENDEDOR: 11-JEFERSON QUARESMA
//   427142 24/05/2026 COLCH I COMERCIAL DE COLCHOES E 17.102,52 0,00 0,00 17.102,52 17.102,52 5,00 855,13
//   ...
//   58.374,52 1.019,60 57.354,92 0,00 0,00 0,00 57.354,92 1.899,13   <- subtotal line
//
// The subtotal line has exactly numeric tokens (no text), 8 of them:
// VL.BRUTO, VL.DESC, TOT.VENDA, VL.ENC, VL.MONT, VL.ENTR, TOT.LÍQ, VLR.COM.
// We take the FIRST such line inside each vendor block (not the last),
// because the very end of the report has a grand-total line in the same
// format that would otherwise get mistaken for the last vendor's subtotal.

function parseNum(s) {
  if (!s) return 0
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
}

function parseDateBR(s) {
  const [d, m, y] = s.split('/').map(Number)
  return new Date(y, m - 1, d)
}

// Heuristic: real quinzenas span ~2 weeks. The "carteira pendente" export
// is always pulled with a much wider window (ex: 01/01 até o fim do mês
// corrente), so anything over 20 dias is treated as a carteira snapshot
// instead of a paid quinzena.
function guessReportType(start, end) {
  const days = (parseDateBR(end) - parseDateBR(start)) / (1000 * 60 * 60 * 24)
  return days > 20 ? 'carteira' : 'quinzena'
}

const NUM_LINE_RE = /^[\d.]+,\d{2}(\s+[\d.]+,\d{2}){6,7}\s*$/
const LOJA_RE = /\b(COLCH|COLTIM)\b/

export function parseReportText(text) {
  const periodMatch = text.match(
    /PER[ÍI]ODO DE (\d{2}\/\d{2}\/\d{4})\s*AT[ÉE]\s*(\d{2}\/\d{2}\/\d{4})/i
  )
  if (!periodMatch) {
    return { error: 'Não encontrei o período ("PERÍODO DE ... ATÉ ...") no PDF.' }
  }
  const start = periodMatch[1]
  const end = periodMatch[2]

  const lojaMatch = text.match(LOJA_RE)
  const loja = lojaMatch ? lojaMatch[1] : null
  if (!loja) {
    return { error: 'Não identifiquei a loja (COLCH/COLTIM) no PDF.' }
  }
  const type = guessReportType(start, end)

  const parts = text.split(/VENDEDOR:\s*/).slice(1)
  if (parts.length === 0) {
    return { error: 'Não encontrei nenhum bloco "VENDEDOR:" no PDF.' }
  }

  const vendors = []
  for (const part of parts) {
    const headerMatch = part.match(/^(\d+)-([^\n\r]+)/)
    if (!headerMatch) continue
    const code = headerMatch[1]
    const name = headerMatch[2].trim()

    const lines = part.split('\n').map((l) => l.trim()).filter(Boolean)
    let subtotalLine = null
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
