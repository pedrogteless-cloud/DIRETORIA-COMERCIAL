import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fmtBRL } from '../lib/format'

export default function PrecosView() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    supabase
      .from('tabela_precos')
      .select('*')
      .order('produto')
      .order('tamanho')
      .then(({ data }) => {
        setItems(data || [])
        setLoading(false)
      })
  }, [])

  const groups = useMemo(() => {
    const filtered = filter
      ? items.filter((i) => i.produto.toUpperCase().includes(filter.toUpperCase()))
      : items
    const gs = []
    for (const item of filtered) {
      let g = gs.find((x) => x.produto === item.produto)
      if (!g) {
        g = { produto: item.produto, items: [] }
        gs.push(g)
      }
      g.items.push(item)
    }
    return gs
  }, [items, filter])

  if (loading) return <div className="text-muted text-sm">Carregando tabela…</div>

  if (items.length === 0) {
    return <div className="text-center py-16 text-muted text-sm">Tabela de preços ainda não disponível.</div>
  }

  return (
    <div>
      <input
        className="w-full bg-panel border border-border rounded-lg px-3.5 py-2.5 text-sm mb-5"
        placeholder="Buscar produto…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="space-y-4">
        {groups.map((group) => {
          const hasPillow = group.items.some((i) => i.pillow != null)
          const hasBaseBox = group.items.some((i) => i.base_box != null)
          return (
            <div key={group.produto} className="rounded-xl border border-border overflow-x-auto bg-panel">
              <div className="min-w-[560px]">
                <div className="px-4 py-3 border-b border-border bg-panel2 flex items-center justify-between gap-3 flex-wrap">
                  <span className="font-semibold text-sm">{group.produto}</span>
                  {group.items[0]?.cores && <span className="text-muted text-xs">{group.items[0].cores}</span>}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-muted border-b border-border">
                      <th className="text-left font-medium px-4 py-2.5">Tamanho</th>
                      {hasPillow && <th className="text-right font-medium px-4 py-2.5">Pillow</th>}
                      <th className="text-right font-medium px-4 py-2.5">Colchão</th>
                      {hasBaseBox && <th className="text-right font-medium px-4 py-2.5">Base Box</th>}
                      <th className="text-right font-medium px-4 py-2.5">Conjunto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-2.5 font-mono text-xs">{item.tamanho}</td>
                        {hasPillow && (
                          <td className="text-right px-4 py-2.5 font-mono">{item.pillow != null ? fmtBRL(item.pillow) : '—'}</td>
                        )}
                        <td className="text-right px-4 py-2.5 font-mono">{item.colchao != null ? fmtBRL(item.colchao) : '—'}</td>
                        {hasBaseBox && (
                          <td className="text-right px-4 py-2.5 font-mono">{item.base_box != null ? fmtBRL(item.base_box) : '—'}</td>
                        )}
                        <td className="text-right px-4 py-2.5 font-mono">{item.conjunto != null ? fmtBRL(item.conjunto) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
