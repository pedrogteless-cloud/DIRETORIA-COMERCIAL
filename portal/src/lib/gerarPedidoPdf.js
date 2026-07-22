import { jsPDF } from 'jspdf'
import autoTableImport from 'jspdf-autotable'
import { fmtBRL } from './format'

// A depender do bundler, o import default do jspdf-autotable vem como a
// função ou como o namespace (com .default). Resolve os dois casos.
const autoTable = typeof autoTableImport === 'function' ? autoTableImport : autoTableImport.default

// Monta o PDF do pedido — layout parecido com o pedido escrito à mão que
// isso substitui: cabeçalho com dados do cliente, corpo com os itens, e as
// duas assinaturas (representante e cliente) no rodapé.
export function gerarPedidoPdf({ cabecalho, itens, assinaturaRep, assinaturaCliente, representante, total }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = 16

  // Título
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('PEDIDO', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(90)
  doc.text('Ley Colchões', pageW - margin, y - 4, { align: 'right' })
  const dataHora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  doc.text(`Emitido em ${dataHora}`, pageW - margin, y, { align: 'right' })
  if (representante?.nome) {
    doc.text(`Representante: ${representante.nome}`, pageW - margin, y + 4, { align: 'right' })
  }
  doc.setTextColor(0)
  y += 8

  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // Bloco de dados do cliente (duas colunas de label: valor)
  const campos = [
    ['Razão social', cabecalho.razao_social],
    ['Nome fantasia', cabecalho.fantasia],
    ['CNPJ', cabecalho.cnpj],
    ['CGF / Insc. Est.', cabecalho.cgf],
    ['Endereço', cabecalho.endereco],
    ['Bairro', cabecalho.bairro],
    ['CEP', cabecalho.cep],
    ['Cidade', cabecalho.cidade],
    ['Estado', cabecalho.estado],
    ['Contato', cabecalho.contato],
    ['Telefone', cabecalho.telefone],
    ['WhatsApp', cabecalho.whatsapp],
    ['E-mail', cabecalho.email],
    ['Local de entrega', cabecalho.local_entrega],
    ['Prazo de pagamento', cabecalho.prazo_pagamento],
    ['Forma de pagamento', cabecalho.forma_pagamento],
    ['Condição Ley', cabecalho.condicao_ley],
  ].filter(([, v]) => v && String(v).trim())

  doc.setFontSize(9)
  const colW = (pageW - margin * 2) / 2
  const lineH = 5.5
  campos.forEach(([label, valor], i) => {
    const col = i % 2
    const x = margin + col * colW
    if (col === 0 && i > 0) y += lineH
    doc.setTextColor(120)
    doc.text(`${label}:`, x, y)
    doc.setTextColor(0)
    const labelW = doc.getTextWidth(`${label}: `)
    doc.text(doc.splitTextToSize(String(valor), colW - labelW - 4), x + labelW, y)
  })
  if (campos.length % 2 === 1) y += lineH
  y += 8

  // Corpo do pedido
  const body = (itens || [])
    .filter((it) => it.descricao || it.qtd || it.preco_unitario)
    .map((it) => {
      const qtd = Number(it.qtd) || 0
      const unit = Number(it.preco_unitario) || 0
      const desc = Number(it.desconto) || 0
      const subtotal = qtd * unit * (1 - desc / 100)
      return [
        qtd || '',
        it.descricao || '',
        unit ? fmtBRL(unit) : '',
        desc ? `${desc}%` : '',
        subtotal ? fmtBRL(subtotal) : '',
      ]
    })

  autoTable(doc, {
    startY: y,
    head: [['Qtd', 'Descrição', 'Preço unit.', 'Desc.', 'Subtotal']],
    body: body.length ? body : [['', '', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [28, 44, 66], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: 20 },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })
  y = doc.lastAutoTable.finalY + 6

  // Total
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Total do pedido: ${fmtBRL(total || 0)}`, pageW - margin, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  y += 8

  // Observações
  if (cabecalho.observacoes && cabecalho.observacoes.trim()) {
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text('Observações:', margin, y)
    doc.setTextColor(0)
    y += 5
    const obs = doc.splitTextToSize(cabecalho.observacoes, pageW - margin * 2)
    doc.text(obs, margin, y)
    y += obs.length * 5 + 4
  }

  // Assinaturas — se não couberem na página, joga pra próxima
  const assinaturaBloco = 40
  if (y + assinaturaBloco > doc.internal.pageSize.getHeight() - 10) {
    doc.addPage()
    y = 20
  } else {
    y += 6
  }
  const sigW = (pageW - margin * 2 - 10) / 2
  const sigY = y
  const imgH = 22
  ;[
    { img: assinaturaRep, label: 'Assinatura do representante', x: margin },
    { img: assinaturaCliente, label: 'Assinatura do cliente', x: margin + sigW + 10 },
  ].forEach(({ img, label, x }) => {
    if (img) {
      try {
        doc.addImage(img, 'PNG', x, sigY, sigW, imgH)
      } catch {
        /* imagem inválida — só desenha a linha */
      }
    }
    const lineY = sigY + imgH + 2
    doc.setDrawColor(120)
    doc.line(x, lineY, x + sigW, lineY)
    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text(label, x + sigW / 2, lineY + 4, { align: 'center' })
    doc.setTextColor(0)
  })

  return doc
}
