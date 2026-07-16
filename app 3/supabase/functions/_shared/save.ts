import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { ParsedReport } from './parseReport.ts'

export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas na function.')
  }
  return createClient(url, key)
}

function isoFromBR(dateBR: string): string {
  const [d, m, y] = dateBR.split('/')
  return `${y}-${m}-${d}`
}

export async function saveQuinzena(supabase: SupabaseClient, result: ParsedReport) {
  const data_inicio = isoFromBR(result.start)
  const data_fim = isoFromBR(result.end)

  const { data: quinzena, error: qErr } = await supabase
    .from('quinzenas')
    .upsert({ data_inicio, data_fim }, { onConflict: 'data_inicio,data_fim' })
    .select()
    .single()
  if (qErr) throw qErr

  const rows = result.vendors.map((v) => ({
    quinzena_id: quinzena.id,
    codigo: v.code,
    nome: v.name,
    loja: result.loja,
    comissao: v.commission,
    vendas_liquidas: v.netSales,
    vendas_brutas: v.grossSales,
  }))
  const { error: cErr } = await supabase
    .from('comissoes_vendedor')
    .upsert(rows, { onConflict: 'quinzena_id,codigo,loja' })
  if (cErr) throw cErr

  await supabase
    .from('datas_pagamento')
    .update({ quinzena_id: quinzena.id })
    .is('quinzena_id', null)
    .gte('data', data_inicio)
    .lte('data', data_fim)

  const totalCommission = result.vendors.reduce((s, v) => s + v.commission, 0)
  return { kind: 'quinzena' as const, totalCommission, start: result.start, end: result.end, loja: result.loja }
}

export async function saveCarteira(supabase: SupabaseClient, result: ParsedReport) {
  const data_relatorio = isoFromBR(result.end)

  const { data: snapshot, error: sErr } = await supabase
    .from('carteira_snapshots')
    .upsert({ data_relatorio, loja: result.loja }, { onConflict: 'data_relatorio,loja' })
    .select()
    .single()
  if (sErr) throw sErr

  const rows = result.vendors.map((v) => ({
    snapshot_id: snapshot.id,
    codigo: v.code,
    nome: v.name,
    valor_pendente: v.netSales,
    comissao_potencial: v.commission,
  }))
  const { error: cErr } = await supabase
    .from('carteira_vendedor')
    .upsert(rows, { onConflict: 'snapshot_id,codigo' })
  if (cErr) throw cErr

  const totalPotencial = result.vendors.reduce((s, v) => s + v.commission, 0)
  return { kind: 'carteira' as const, totalPotencial, loja: result.loja, dataRelatorio: data_relatorio }
}
