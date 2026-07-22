import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fmtBRL } from '../lib/format'
import { agruparPorProduto } from '../lib/agrupar'
import { useProdutosMeta } from '../lib/useProdutosMeta'
import { Spinner, EmptyState } from './ui'

export default function PrecosView() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const [filter, setFilter] = useState('')
  const meta = useProdutosMeta()

  useEffect(() => {
    let vivo = true
    supabase
      .from('tabela_precos')
      .select('*')
      .order('produto')
      .order('tamanho')
      .then(({ data, error }) => {
        if (!vivo) return
        setItems(data || [])
        setErro(error?.message || null)
        setLoading(false)
      })
    return () => {
      vivo = false
    }
  }, [])

  const groups = useMemo(() => {
    const filtered = filter
      ? items.filter((i) => i.produto.toUpperCase().includes(filter.toUpperCase()))
      : items
    return agruparPorProduto(filtered)
  }, [items, filter])

  if (loading) return <Spinner />
  if (erro) return <EmptyState titulo="Não deu pra carregar">Tente de novo daqui a pouco.</EmptyState>
  if (items.length === 0) return <EmptyState titulo="Tabela ainda não disponível" />

  return (
    <div>
      <input
        className="w-full bg-panel border border-border rounded-lg px-3.5 py-2.5 text-base mb-5"
        placeholder="Buscar produto…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {groups.length === 0 && <EmptyState>Nenhum produto encontrado com "{filter}".</EmptyState>}

      <div className="space-y-4">
        {groups.map((group) => {
          const info = meta[group.produto] || {}
          const cores = info.cores || group.items[0]?.cores
          const hasPillow = group.items.some((i) => i.pillow != null)
          const hasBaseBox = group.items.some((i) => i.base_box != null)
          return (
            <div key={group.produto} className="rounded-xl border border-border bg-panel overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-panel2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="font-semibold text-sm">{group.produto}</span>
                  {cores && <span className="text-muted text-xs">{cores}</span>}
                </div>
                {info.descricao && <p className="text-muted text-xs mt-1">{info.descricao}</p>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
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
