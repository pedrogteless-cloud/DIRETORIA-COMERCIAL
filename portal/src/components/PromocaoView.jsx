import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fmtBRL } from '../lib/format'

export default function PromocaoView() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tabela_promocional')
      .select('*')
      .order('produto')
      .order('tamanho')
      .then(({ data }) => {
        setItems(data || [])
        setLoading(false)
      })
  }, [])

  const { campanha, groups } = useMemo(() => {
    const gs = []
    for (const item of items) {
      let g = gs.find((x) => x.produto === item.produto)
      if (!g) {
        g = { produto: item.produto, items: [] }
        gs.push(g)
      }
      g.items.push(item)
    }
    return { campanha: items[0]?.campanha, groups: gs }
  }, [items])

  if (loading) return <div className="text-muted text-sm">Carregando…</div>

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <p className="font-display text-lg text-white mb-2">Nenhuma promoção ativa</p>
        <p className="text-sm">Quando tiver campanha rolando, os preços promocionais aparecem aqui.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-panel px-4 py-4 mb-5">
        <div className="text-[11px] uppercase tracking-wide text-amber-400 font-semibold">🎁 Promoção ativa</div>
        <h2 className="font-display text-xl font-semibold mt-0.5">{campanha}</h2>
      </div>

      <div className="space-y-4">
        {groups.map((group) => {
          const hasBaseBox = group.items.some((i) => i.base_box != null)
          return (
            <div key={group.produto} className="rounded-xl border border-border bg-panel overflow-x-auto">
              <div className="min-w-[440px]">
                <div className="px-4 py-3 border-b border-border bg-panel2 flex items-center justify-between gap-3 flex-wrap">
                  <span className="font-semibold text-sm">{group.produto}</span>
                  {group.items[0]?.cores && <span className="text-muted text-xs">{group.items[0].cores}</span>}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-muted border-b border-border">
                      <th className="text-left font-medium px-4 py-2.5">Tamanho</th>
                      <th className="text-right font-medium px-4 py-2.5">Colchão</th>
                      {hasBaseBox && <th className="text-right font-medium px-4 py-2.5">Base Box</th>}
                      <th className="text-right font-medium px-4 py-2.5">Conjunto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-2.5 font-mono text-xs">{item.tamanho}</td>
                        <td className="text-right px-4 py-2.5 font-mono text-amber-300">
                          {item.colchao != null ? fmtBRL(item.colchao) : '—'}
                        </td>
                        {hasBaseBox && (
                          <td className="text-right px-4 py-2.5 font-mono text-amber-300">
                            {item.base_box != null ? fmtBRL(item.base_box) : '—'}
                          </td>
                        )}
                        <td className="text-right px-4 py-2.5 font-mono text-amber-300">
                          {item.conjunto != null ? fmtBRL(item.conjunto) : '—'}
                        </td>
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
