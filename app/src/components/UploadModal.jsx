import { useState } from 'react'
import { extractPdfText } from '../lib/extractPdfText'
import { parseReportText } from '../lib/parseReport'
import { supabase } from '../lib/supabaseClient'
import { fmtBRL } from '../lib/format'

function isoFromBR(dateBR) {
  const [d, m, y] = dateBR.split('/')
  return `${y}-${m}-${d}`
}

async function saveQuinzena(result) {
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

  // Se já existia uma data de pagamento agendada dentro desse período,
  // liga essa quinzena a ela — é isso que marca a data como "cumprida"
  // no calendário (a presença de quinzena_id, não um campo separado).
  await supabase
    .from('datas_pagamento')
    .update({ quinzena_id: quinzena.id })
    .is('quinzena_id', null)
    .gte('data', data_inicio)
    .lte('data', data_fim)

  return { kind: 'quinzena', totalCommission: result.vendors.reduce((s, v) => s + v.commission, 0) }
}

async function saveCarteira(result) {
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

  return { kind: 'carteira', totalPotencial: result.vendors.reduce((s, v) => s + v.commission, 0) }
}

export default function UploadModal({ onClose, onDone }) {
  const [files, setFiles] = useState([]) // { name, status, message }

  async function handleFiles(fileList) {
    const list = Array.from(fileList)
    const entries = list.map((f) => ({ name: f.name, status: 'reading', message: '' }))
    setFiles(entries)

    let anySaved = false
    for (let i = 0; i < list.length; i++) {
      try {
        const text = await extractPdfText(list[i])
        const result = parseReportText(text)
        if (result.error) {
          entries[i] = { name: list[i].name, status: 'error', message: result.error }
          setFiles([...entries])
          continue
        }
        const summary = result.type === 'carteira' ? await saveCarteira(result) : await saveQuinzena(result)
        anySaved = true
        const lojaLabel = result.loja === 'COLCH' ? 'Matriz' : 'Filial'
        const typeLabel = result.type === 'carteira' ? 'Carteira pendente' : 'Quinzena paga'
        const value = summary.kind === 'carteira' ? summary.totalPotencial : summary.totalCommission
        entries[i] = {
          name: list[i].name,
          status: 'ok',
          message: `${typeLabel} · ${lojaLabel} · ${fmtBRL(value)}`,
        }
      } catch (err) {
        entries[i] = { name: list[i].name, status: 'error', message: 'Erro: ' + (err.message || String(err)) }
      }
      setFiles([...entries])
    }
    if (anySaved) onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-lg">
        <h3 className="font-display text-xl mb-1.5">Novos relatórios</h3>
        <p className="text-muted text-sm mb-4 leading-relaxed">
          Envie os PDFs do L2.3.28 exportados do Infobrasil — pode selecionar vários de uma vez (matriz, filial,
          quinzena e carteira pendente juntos). O app identifica sozinho a loja e se é comissão paga ou carteira
          pendente de faturar.
        </p>

        <label className="block border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-white/[0.02]">
          <input
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <span className="text-sm text-muted">Clique para escolher um ou mais PDFs</span>
        </label>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f) => (
              <div key={f.name} className="flex items-start justify-between gap-3 text-sm border-b border-border pb-2">
                <span className="text-muted truncate">{f.name}</span>
                {f.status === 'reading' && <span className="text-muted text-xs whitespace-nowrap">lendo…</span>}
                {f.status === 'ok' && <span className="text-teal text-xs text-right whitespace-nowrap">{f.message}</span>}
                {f.status === 'error' && <span className="text-coral text-xs text-right max-w-[55%]">{f.message}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2.5 mt-5">
          <button onClick={onClose} className="border border-border text-muted rounded-lg px-4 py-2 text-sm hover:bg-white/5">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
