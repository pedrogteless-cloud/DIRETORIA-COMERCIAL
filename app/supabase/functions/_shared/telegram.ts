const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

function apiUrl(method: string) {
  if (!TOKEN) throw new Error('TELEGRAM_BOT_TOKEN não configurado.')
  return `https://api.telegram.org/bot${TOKEN}/${method}`
}

export async function sendMessage(chatId: number | string, text: string) {
  const res = await fetch(apiUrl('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  if (!res.ok) {
    console.error('Falha ao enviar mensagem no Telegram:', await res.text())
  }
}

// Downloads a Telegram file (ex: o PDF enviado no chat) e retorna os bytes.
export async function downloadTelegramFile(fileId: string): Promise<Uint8Array> {
  const getFileRes = await fetch(apiUrl('getFile') + `?file_id=${fileId}`)
  const getFileJson = await getFileRes.json()
  if (!getFileJson.ok) throw new Error('Falha ao obter o arquivo do Telegram: ' + JSON.stringify(getFileJson))
  const filePath = getFileJson.result.file_path

  const fileRes = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${filePath}`)
  if (!fileRes.ok) throw new Error('Falha ao baixar o arquivo do Telegram.')
  const buffer = await fileRes.arrayBuffer()
  return new Uint8Array(buffer)
}
