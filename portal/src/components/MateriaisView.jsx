import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function publicUrl(path) {
  return supabase.storage.from('materiais').getPublicUrl(path).data.publicUrl
}

async function baixar(item) {
  // Força download em vez de abrir no navegador — o representante quer o
  // arquivo salvo no celular pra mandar pro cliente.
  try {
    const url = publicUrl(item.storage_path)
    const resp = await fetch(url)
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

  useEffect(() => {
    supabase
      .from('materiais_produto')
      .select('*')
      .order('produto')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMateriais(data || [])
        setLoading(false)
      })
  }, [])

  const grouped = useMemo(() => {
    const filtered = filter
      ? materiais.filter((m) => m.produto.toUpperCase().includes(filter.toUpperCase()))
      : materiais
    const groups = []
    for (const m of filtered) {
      let g = groups.find((x) => x.produto === m.produto)
      if (!g) {
        g = { produto: m.produto, items: [] }
        groups.push(g)
      }
      g.items.push(m)
    }
    return groups
  }, [materiais, filter])

  if (loading) return <div className="text-muted text-sm">Carregando materiais…</div>

  return (
    <div>
      <input
        className="w-full bg-panel border border-border rounded-lg px-3.5 py-2.5 text-sm mb-5"
        placeholder="Buscar produto…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {materiais.length === 0 && (
        <div className="text-center py-16 text-muted">
          <p className="font-display text-lg text-white mb-2">Ainda não tem material aqui</p>
          <p className="text-sm">A diretoria está subindo as fotos e catálogos. Volte em breve.</p>
        </div>
      )}

      {materiais.length > 0 && grouped.length === 0 && (
        <div className="text-center py-10 text-muted text-sm">Nenhum produto encontrado com "{filter}".</div>
      )}

      <div className="space-y-5">
        {grouped.map((g) => (
          <div key={g.produto} className="rounded-xl border border-border bg-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-panel2 font-semibold">
              {g.produto}
              <span className="text-muted font-normal text-xs"> · {g.items.length} arquivo{g.items.length !== 1 ? 's' : ''}</span>
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
        ))}
      </div>
    </div>
  )
}
