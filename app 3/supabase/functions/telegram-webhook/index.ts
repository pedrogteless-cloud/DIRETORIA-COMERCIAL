// Recebe updates do bot do Telegram. Configurado como webhook via:
//   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<esta-function-url>"
//
// Fluxo: Pedro manda o PDF do relatório L2.3.28 no chat privado com o bot →
// esta function baixa o arquivo, extrai o texto, identifica se é quinzena
// paga ou carteira pendente (e qual loja), grava no Supabase, e responde
// com a confirmação dos números.
//
// AVISO: a extração de texto do PDF aqui usa a lib `unpdf`, que não pôde
// ser testada neste ambiente (sem acesso de rede ao Deno/npm daqui). Ao
// implantar, teste com um PDF real antes de confiar no fluxo — se a
// extração de linhas vier diferente da versão do navegador (extractPdfText.js),
// pode ser necessário ajustar a extração de texto abaixo.

import { extractText, getDocumentProxy } from 'npm:unpdf@0.11.0'
import { parseReportText } from '../_shared/parseReport.ts'
import { getServiceClient, saveQuinzena, saveCarteira } from '../_shared/save.ts'
import { sendMessage, downloadTelegramFile } from '../_shared/telegram.ts'

const ALLOWED_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')

function fmtBRL(n: number) {
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

Deno.serve(async (req) => {
  try {
    const update = await req.json()
    const message = update.message
    if (!message) return new Response('ok')

    const chatId = message.chat?.id
    // Segurança simples: só processa mensagens do chat privado do Pedro.
    if (ALLOWED_CHAT_ID && String(chatId) !== String(ALLOWED_CHAT_ID)) {
      return new Response('ok')
    }

    const document = message.document
    const isPdf =
      document && (document.mime_type === 'application/pdf' || document.file_name?.toLowerCase().endsWith('.pdf'))

    if (!isPdf) {
      await sendMessage(chatId, 'Me envie o PDF do relatório L2.3.28 (quinzena paga ou carteira pendente) exportado do Infobrasil.')
      return new Response('ok')
    }

    const bytes = await downloadTelegramFile(document.file_id)
    const pdf = await getDocumentProxy(bytes)
    const { text } = await extractText(pdf, { mergePages: true })

    const result = parseReportText(text)
    if ('error' in result) {
      await sendMessage(chatId, `Não consegui ler esse relatório: ${result.error}`)
      return new Response('ok')
    }

    const supabase = getServiceClient()
    const lojaLabel = result.loja === 'COLCH' ? 'Matriz' : 'Filial'

    if (result.type === 'carteira') {
      const summary = await saveCarteira(supabase, result)
      await sendMessage(
        chatId,
        `Carteira pendente atualizada · ${lojaLabel}\nComissão potencial na carteira: ${fmtBRL(summary.totalPotencial)}`
      )
    } else {
      const summary = await saveQuinzena(supabase, result)
      await sendMessage(
        chatId,
        `Quinzena ${summary.start}–${summary.end} registrada · ${lojaLabel}\nTotal de comissão: ${fmtBRL(summary.totalCommission)}`
      )
    }

    return new Response('ok')
  } catch (err) {
    console.error(err)
    return new Response('ok') // sempre 200 pro Telegram não re-tentar em loop
  }
})
