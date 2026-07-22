import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { agruparPorProduto } from '../lib/agrupar'
import { useProdutosMeta } from '../lib/useProdutosMeta'
import { Spinner, EmptyState } from './ui'

function publicUrl(path) {
  return supabase.storage.from('materiais').getPublicUrl(path).data.publicUrl
}

async function baixar(item) {
  // Força o download em vez de abrir no navegador — o representante quer o
  // arquivo salvo no celular pra mandar pro cliente.
  try {
    const resp = await fetch(publicUrl(item.storage_path))
    const blob = await resp.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = item.nome_arquivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  } catch {
    window.open(publicUrl(item.storage_path), '_blank')
  }
}

export default function MateriaisView() {
  const [materiais, setMateriais] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const meta = useProdutosMeta()

  useEffect(() => {
    let vivo = true
    supabase
      .from('materiais_produto')
      .select('*')
      .order('produto')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!vivo) return
        setMateriais(data || [])
        setLoading(false)
      })
    return () => {
      vivo = false
    }
  }, [])

  const grouped = useMemo(() => {
    const filtered = filter
      ? materiais.filter((m) => m.produto.toUpperCase().includes(filter.toUpperCase()))
      : materiais
    return agruparPorProduto(filtered)
  }, [materiais, filter])

  if (loading) return <Spinner label="Carregando catálogo…" />

  if (materiais.length === 0) {
    return (
      <EmptyState titulo="Ainda não tem material aqui">
        A diretoria está subindo as fotos e catálogos. Volte em breve.
      </EmptyState>
    )
  }

  return (
    <div>
      <input
        className="w-full bg-panel border border-border rounded-lg px-3.5 py-2.5 text-base mb-5"
        placeholder="Buscar produto…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {grouped.length === 0 && <EmptyState>Nenhum produto encontrado com "{filter}".</EmptyState>}

      <div className="space-y-5">
        {grouped.map((g) => {
          const info = meta[g.produto] || {}
          return (
            <div key={g.produto} className="rounded-xl border border-border bg-panel overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-panel2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="font-semibold">{g.produto}</span>
                  {info.cores && <span className="text-muted text-xs">{info.cores}</span>}
                </div>
                {info.descricao && <p className="text-muted text-xs mt-1">{info.descricao}</p>}
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {g.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border overflow-hidden bg-panel2">
                    {item.tipo === 'foto' ? (
                      <img
                        src={publicUrl(item.storage_path)}
                        alt={item.nome_arquivo}
                        loading="lazy"
                        className="w-full aspect-square object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-square flex items-center justify-center text-4xl">📄</div>
                    )}
                    <button
                      onClick={() => baixar(item)}
                      className="w-full text-center text-xs font-semibold text-accent hover:bg-white/5 py-2.5 border-t border-border"
                    >
                      ⬇ Baixar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
