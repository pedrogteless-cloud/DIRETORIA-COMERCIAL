import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Edita os metadados de produto (cores + descrição) que aparecem no portal.
// A lista de produtos vem da tabela de preços vigente unida com o que já
// está salvo em produtos_cores (pra não sumir produto descontinuado que
// ainda tenha metadado). Salvar faz upsert por produto.
export default function ProdutosAdmin() {
  const [linhas, setLinhas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [savingKey, setSavingKey] = useState(null)
  const [savedKey, setSavedKey] = useState(null)

  async function load() {
    setLoading(true)
    const [{ data: precos }, { data: meta }] = await Promise.all([
      supabase.from('tabela_precos').select('produto'),
      supabase.from('produtos_cores').select('*'),
    ])
    const metaMap = Object.fromEntries((meta || []).map((m) => [m.produto, m]))
    const nomes = new Set([...(precos || []).map((p) => p.produto), ...Object.keys(metaMap)])
    const rows = [...nomes]
      .sort()
      .map((produto) => ({
        produto,
        cores: metaMap[produto]?.cores || '',
        descricao: metaMap[produto]?.descricao || '',
      }))
    setLinhas(rows)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function setCampo(produto, campo, valor) {
    setLinhas((ls) => ls.map((l) => (l.produto === produto ? { ...l, [campo]: valor } : l)))
    setSavedKey(null)
  }

  async function salvar(linha) {
    setSavingKey(linha.produto)
    await supabase.from('produtos_cores').upsert({
      produto: linha.produto,
      cores: linha.cores.trim() || null,
      descricao: linha.descricao.trim() || null,
    })
    setSavingKey(null)
    setSavedKey(linha.produto)
    setTimeout(() => setSavedKey((k) => (k === linha.produto ? null : k)), 2000)
  }

  const filtradas = useMemo(
    () => (filtro ? linhas.filter((l) => l.produto.toUpperCase().includes(filtro.toUpperCase())) : linhas),
    [linhas, filtro]
  )

  if (loading) return <div className="text-muted text-sm">Carregando…</div>

  return (
    <div>
      <p className="text-muted text-sm mb-4">
        Cores e descrição de cada produto — é isso que o representante vê no portal. Some ou muda quando a
        tabela de preços troca? Não: esses dados ficam guardados à parte e continuam valendo.
      </p>

      <input
        className="w-full sm:w-80 bg-panel border border-border rounded-lg px-3.5 py-2.5 text-sm mb-4"
        placeholder="Buscar produto…"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      {filtradas.length === 0 && (
        <div className="text-center py-10 text-muted text-sm">
          Nenhum produto encontrado. Envie a tabela de preços na aba Preços pra listar os produtos aqui.
        </div>
      )}

      <div className="space-y-3">
        {filtradas.map((linha) => (
          <div key={linha.produto} className="rounded-xl border border-border bg-panel p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="font-semibold text-sm">{linha.produto}</span>
              <div className="flex items-center gap-2">
                {savedKey === linha.produto && <span className="text-teal text-xs">salvo ✓</span>}
                <button
                  onClick={() => salvar(linha)}
                  disabled={savingKey === linha.produto}
                  className="bg-accent text-[#0B1524] rounded-lg px-3 py-1.5 text-xs font-semibold hover:brightness-110 disabled:opacity-50"
                >
                  {savingKey === linha.produto ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-[11px] text-muted mb-1">Cores disponíveis</span>
                <input
                  className="w-full bg-panel2 border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: Marrom, Cappuccino"
                  value={linha.cores}
                  onChange={(e) => setCampo(linha.produto, 'cores', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block text-[11px] text-muted mb-1">Descrição</span>
                <input
                  className="w-full bg-panel2 border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: Molas ensacadas, pillow, suporte até 120kg"
                  value={linha.descricao}
                  onChange={(e) => setCampo(linha.produto, 'descricao', e.target.value)}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
