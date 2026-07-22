import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fmtBRL } from '../lib/format'
import { agruparPorProduto } from '../lib/agrupar'
import { Spinner, EmptyState } from './ui'

export default function PromocaoView() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let vivo = true
    supabase
      .from('tabela_promocional')
      .select('*')
      .order('produto')
      .order('tamanho')
      .then(({ data }) => {
        if (!vivo) return
        setItems(data || [])
        setLoading(false)
      })
    return () => {
      vivo = false
    }
  }, [])

  const { campanha, groups } = useMemo(
    () => ({ campanha: items[0]?.campanha, groups: agruparPorProduto(items) }),
    [items]
  )

  if (loading) return <Spinner />

  if (items.length === 0) {
    return (
      <EmptyState titulo="Nenhuma promoção ativa">
        Quando tiver campanha rolando, os preços promocionais aparecem aqui.
      </EmptyState>
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
            <div key={group.produto} className="rounded-xl border border-border bg-panel overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-panel2 flex items-center justify-between gap-3 flex-wrap">
                <span className="font-semibold text-sm">{group.produto}</span>
                {group.items[0]?.cores && <span className="text-muted text-xs">{group.items[0].cores}</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[420px]">
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
