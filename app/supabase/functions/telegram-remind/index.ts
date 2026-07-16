// Chamada 1x por dia pelo pg_cron (ver migration 0004_cron.sql). Checa se
// hoje é uma data marcada no calendário (datas_pagamento) que ainda não
// recebeu lembrete, e manda a cobrança pelo Telegram.

import { getServiceClient } from '../_shared/save.ts'
import { sendMessage } from '../_shared/telegram.ts'

const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')

function todayISO_Fortaleza(): string {
  // America/Fortaleza é UTC-3, sem horário de verão.
  const now = new Date()
  const fortaleza = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  return fortaleza.toISOString().slice(0, 10)
}

Deno.serve(async () => {
  try {
    if (!CHAT_ID) return new Response('TELEGRAM_CHAT_ID não configurado', { status: 500 })

    const supabase = getServiceClient()
    const today = todayISO_Fortaleza()

    const { data: pendentes, error } = await supabase
      .from('datas_pagamento')
      .select('*')
      .eq('data', today)
      .eq('lembrete_enviado', false)
    if (error) throw error

    for (const row of pendentes ?? []) {
      await sendMessage(
        CHAT_ID,
        `Hoje (${today.split('-').reverse().join('/')}) é dia de quinzena. Me manda os relatórios L2.3.28 (matriz, filial e carteira pendente) quando tirar do Infobrasil.`
      )
      await supabase.from('datas_pagamento').update({ lembrete_enviado: true }).eq('id', row.id)
    }

    return new Response(JSON.stringify({ lembretes_enviados: pendentes?.length ?? 0 }))
  } catch (err) {
    console.error(err)
    return new Response('erro', { status: 500 })
  }
})
