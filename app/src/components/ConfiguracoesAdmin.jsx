import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const CAMPOS = [
  {
    chave: 'whatsapp_pedidos_eusebio',
    label: 'WhatsApp da digitadora — Eusébio (matriz)',
    placeholder: '5585999999999',
  },
  {
    chave: 'whatsapp_pedidos_timon',
    label: 'WhatsApp da digitadora — Timon (filial)',
    placeholder: '5599999999999',
  },
]

export default function ConfiguracoesAdmin() {
  const [valores, setValores] = useState({})
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('configuracoes').select('*')
    const map = Object.fromEntries((data || []).map((c) => [c.chave, c.valor || '']))
    setValores(map)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function salvar() {
    setSaved(false)
    const rows = CAMPOS.map((c) => ({ chave: c.chave, valor: (valores[c.chave] || '').replace(/\D/g, '') }))
    await supabase.from('configuracoes').upsert(rows)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div className="text-muted text-sm">Carregando…</div>

  return (
    <div className="max-w-xl">
      <div className="rounded-xl border border-border bg-panel p-5">
        <h3 className="font-display text-lg mb-1">Para onde vão os pedidos</h3>
        <p className="text-muted text-sm mb-4">
          Número de WhatsApp da digitadora/recebedora de pedidos de cada fábrica. O representante escolhe a
          fábrica na hora de enviar o pedido. Use o formato com código do país e DDD, só números (ex:
          5585999999999).
        </p>
        <div className="space-y-3.5">
          {CAMPOS.map((c) => (
            <div key={c.chave}>
              <label className="block text-xs text-muted mb-1.5">{c.label}</label>
              <input
                className="w-full bg-panel2 text-white border border-border rounded-lg px-3 py-2 text-sm font-mono"
                placeholder={c.placeholder}
                value={valores[c.chave] || ''}
                onChange={(e) => setValores((v) => ({ ...v, [c.chave]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={salvar}
            className="bg-accent text-[#0B1524] rounded-lg px-4 py-2 text-sm font-semibold hover:brightness-110"
          >
            Salvar
          </button>
          {saved && <span className="text-teal text-sm">Salvo ✓</span>}
        </div>
      </div>
    </div>
  )
}
