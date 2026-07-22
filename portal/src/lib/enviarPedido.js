// Envia o PDF do pedido pro WhatsApp. No celular usa a Web Share API, que
// deixa anexar o arquivo direto na conversa do WhatsApp (o representante só
// escolhe o contato da digitadora). Onde isso não existe (desktop), cai no
// fallback: baixa o PDF e abre o WhatsApp com o texto pronto pra anexar
// manualmente. O wa.me não aceita anexo por link — por isso o Web Share é o
// caminho principal.
export async function enviarPedidoWhatsApp({ blob, fileName, texto, numero }) {
  const file = new File([blob], fileName, { type: 'application/pdf' })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: texto, title: fileName })
      return { via: 'share', ok: true }
    } catch (err) {
      if (err && err.name === 'AbortError') return { via: 'cancel', ok: false }
      // se o share falhar por outro motivo, segue pro fallback
    }
  }

  // Fallback: baixa o PDF e abre o WhatsApp com a mensagem pronta.
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  const num = (numero || '').replace(/\D/g, '')
  const waUrl = num
    ? `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`
  window.open(waUrl, '_blank')
  return { via: 'fallback', ok: true }
}
