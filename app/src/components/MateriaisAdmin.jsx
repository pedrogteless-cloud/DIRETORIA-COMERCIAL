import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function slugify(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function MateriaisAdmin() {
  const [produtos, setProdutos] = useState([])
  const [produto, setProduto] = useState('')
  const [materiais, setMateriais] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const [{ data: precos }, { data: mats }] = await Promise.all([
      supabase.from('tabela_precos').select('produto'),
      supabase.from('materiais_produto').select('*').order('produto').order('created_at', { ascending: false }),
    ])
    const distinct = [...new Set((precos || []).map((p) => p.produto))].sort()
    setProdutos(distinct)
    if (!produto && distinct.length > 0) setProduto(distinct[0])
    setMateriais(mats || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleUpload(files) {
    if (!produto) {
      setError('Escolha o produto antes de enviar o arquivo.')
      return
    }
    setError('')
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const path = `${slugify(produto)}/${Date.now()}-${slugify(file.name)}`
        const { error: upErr } = await supabase.storage.from('materiais').upload(path, file)
        if (upErr) throw upErr
        const tipo = file.type.startsWith('image/') ? 'foto' : 'documento'
        const { error: insErr } = await supabase.from('materiais_produto').insert({
          produto,
          tipo,
          storage_path: path,
          nome_arquivo: file.name,
        })
        if (insErr) throw insErr
      }
      await load()
    } catch (err) {
      setError('Erro ao enviar: ' + (err.message || String(err)))
    } finally {
      setUploading(false)
    }
  }

  async function remove(item) {
    if (!confirm(`Remover "${item.nome_arquivo}"?`)) return
    await supabase.storage.from('materiais').remove([item.storage_path])
    await supabase.from('materiais_produto').delete().eq('id', item.id)
    load()
  }

  function publicUrl(path) {
    return supabase.storage.from('materiais').getPublicUrl(path).data.publicUrl
  }

  const grouped = []
  for (const m of materiais) {
    let g = grouped.find((x) => x.produto === m.produto)
    if (!g) {
      g = { produto: m.produto, items: [] }
      grouped.push(g)
    }
    g.items.push(m)
  }

  return (
    <div>
      <div className="rounded-xl border border-border bg-panel p-5 mb-6">
        <h3 className="font-display text-lg mb-3">Enviar material</h3>
        <div className="flex flex-wrap gap-2.5 items-center mb-3">
          <select
            className="bg-panel2 text-white border border-border rounded-lg px-3 py-2 text-sm"
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
          >
            {produtos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <label
            className={`border border-dashed border-border rounded-lg px-4 py-2 text-sm cursor-pointer hover:bg-white/[0.02] ${
              uploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files.length && handleUpload(e.target.files)}
            />
            {uploading ? 'Enviando…' : 'Escolher arquivos (fotos ou PDF)'}
          </label>
        </div>
        {error && <div className="text-coral text-sm">{error}</div>}
      </div>

      {loading && <div className="text-muted text-sm">Carregando…</div>}

      {!loading && grouped.length === 0 && (
        <div className="text-center py-10 text-muted text-sm">Nenhum material enviado ainda.</div>
      )}

      <div className="space-y-4">
        {grouped.map((g) => (
          <div key={g.produto} className="rounded-xl border border-border bg-panel overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-panel2 font-semibold text-sm">
              {g.produto} <span className="text-muted font-normal text-xs">· {g.items.length} arquivo{g.items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="p-4 flex flex-wrap gap-3">
              {g.items.map((item) => (
                <div key={item.id} className="w-28 text-center">
                  {item.tipo === 'foto' ? (
                    <a href={publicUrl(item.storage_path)} target="_blank" rel="noreferrer">
                      <img
                        src={publicUrl(item.storage_path)}
                        alt={item.nome_arquivo}
                        className="w-28 h-28 object-cover rounded-lg border border-border mb-1.5"
                      />
                    </a>
                  ) : (
                    <a
                      href={publicUrl(item.storage_path)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-28 h-28 flex items-center justify-center rounded-lg border border-border mb-1.5 bg-panel2 text-3xl"
                    >
                      📄
                    </a>
                  )}
                  <div className="text-[10px] text-muted truncate" title={item.nome_arquivo}>
                    {item.nome_arquivo}
                  </div>
                  <button onClick={() => remove(item)} className="text-[10px] text-coral hover:underline">
                    remover
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
