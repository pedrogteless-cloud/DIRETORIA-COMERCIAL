// Parses the "TABELA REPRESENTANTES – LEY COLCHÕES" price list PDFs.
//
// Each data row already carries the full product name inline, e.g.:
//   MASTER C/ PILLOW 088X188 R$ 1.500,00 R$ 329,00 R$ 1.829,00
// so rows parse standalone — no need to correlate them with the
// decorative section-title banners the PDF also contains.
//
// The number of "R$ ..." amounts on a row tells us which price columns
// are present, since not every product line sells a standalone pillow:
//   1 valor  -> [preço único (ex: Unibox)] vira colchão = conjunto
//   2 valores -> [preço único (colchão ou unibox), conjunto]
//   3 valores -> [colchão, base box, conjunto]
//   4 valores -> [pillow avulso, colchão, base box, conjunto]  (ex: Elegance)
//
// Header lines ("PRODUTO TAMANHO PILLOW COLCHÃO (30CM) ...") precede each
// block de rows e carregam a altura (cm) de cada componente — guardamos a
// última header vista pra anotar as linhas seguintes. Nem toda tabela tem
// coluna de pillow (ex: linhas "PRODUTO TAMANHO ... UNIBOX (60CM)"), então
// o header só exige "PRODUTO" + "TAMANHO" no começo.
//
// Algumas tabelas trazem uma "VÁLIDO ATÉ dd/mm/aaaa" no rodapé; outras não
// (ex: julho/2026) — quando ausente, seguimos sem data de validade.

function parseNum(s) {
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
}

const HEADER_RE = /^PRODUTO\s+TAMANHO\b/
const ROW_RE = /^(.+?)\s+(\d{3}X\d{3})\s+((?:R\$\s*[\d.,]+\s*)+)$/
const AMOUNT_RE = /R\$\s*([\d.,]+)/g
const CM_RE = /\((\d+(?:\/\d+)?CM)\)/g
const PILLOW_ALTURA_RE = /PILLOW\s*\(\d+CM\)/

export function parseTabelaPrecosText(text) {
  const validadeMatch = text.match(/V[ÁA]LIDO AT[ÉE]\s*(\d{2}\/\d{2}\/\d{4})/i)
  let validade = null
  if (validadeMatch) {
    const [d, m, y] = validadeMatch[1].split('/')
    validade = `${y}-${m}-${d}`
  }

  let colchaoAltura = null
  let baseBoxAltura = null
  let conjuntoAltura = null

  const items = []
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  for (const line of lines) {
    if (HEADER_RE.test(line)) {
      const cms = [...line.matchAll(CM_RE)].map((mm) => mm[1].toLowerCase())
      const idx = PILLOW_ALTURA_RE.test(line) ? 1 : 0 // pula a altura do pillow, se houver
      colchaoAltura = cms[idx] ?? null
      baseBoxAltura = cms[idx + 1] ?? null
      conjuntoAltura = cms[idx + 2] ?? null
      continue
    }

    const rowMatch = line.match(ROW_RE)
    if (!rowMatch) continue

    const produto = rowMatch[1].trim()
    const tamanho = rowMatch[2]
    const amounts = [...rowMatch[3].matchAll(AMOUNT_RE)].map((mm) => parseNum(mm[1]))

    let pillow = null
    let colchao = null
    let base_box = null
    let conjunto = null
    if (amounts.length === 4) {
      ;[pillow, colchao, base_box, conjunto] = amounts
    } else if (amounts.length === 3) {
      ;[colchao, base_box, conjunto] = amounts
    } else if (amounts.length === 2) {
      ;[colchao, conjunto] = amounts
    } else if (amounts.length === 1) {
      ;[colchao] = amounts
      conjunto = colchao
    } else {
      continue
    }

    // Algumas tabelas repetem o mesmo produto+tamanho em blocos duplicados
    // no fim do PDF (erro de formatação da planilha de origem) — fica só
    // a primeira ocorrência.
    if (items.some((i) => i.produto === produto && i.tamanho === tamanho)) continue

    items.push({
      produto,
      tamanho,
      pillow,
      colchao,
      colchao_altura: colchao != null ? colchaoAltura : null,
      base_box,
      base_box_altura: base_box != null ? baseBoxAltura : null,
      conjunto,
      conjunto_altura: conjunto != null ? conjuntoAltura : null,
    })
  }

  if (items.length === 0) {
    return { error: 'Nenhum produto reconhecido nesse PDF. Confira se o formato da tabela mudou.' }
  }

  return { validade, items }
}
