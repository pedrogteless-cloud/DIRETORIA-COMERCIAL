import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// Reads a File object (the uploaded PDF) and returns its full text content,
// with page breaks preserved as newlines so the report's line structure
// (VENDEDOR: blocks, subtotal rows) survives extraction.
export async function extractPdfText(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  let fullText = ''

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    // Group text items by their vertical position (y) to reconstruct lines,
    // since pdfjs returns individual text fragments, not lines.
    const lines = new Map()
    for (const item of content.items) {
      const y = Math.round(item.transform[5])
      if (!lines.has(y)) lines.set(y, [])
      lines.get(y).push(item)
    }
    const sortedY = [...lines.keys()].sort((a, b) => b - a)
    for (const y of sortedY) {
      const lineItems = lines.get(y).sort((a, b) => a.transform[4] - b.transform[4])
      fullText += lineItems.map((i) => i.str).join(' ') + '\n'
    }
    fullText += '\n'
  }

  return fullText
}
