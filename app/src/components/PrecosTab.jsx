import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fmtBRL } from '../lib/format'
import UploadPrecosModal from './UploadPrecosModal'

function fmtDateShort(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function PrecosTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('tabela_precos').select('*').order('produto').order('tamanho')
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const validade = items[0]?.validade
  const filtered = filter
    ? items.filter((i) => i.produto.toUpperCase().includes(filter.toUpperCase()))
    : items

  const groups = []
  for (const item of filtered) {
    let group = groups.find((g) => g.produto === item.produto)
    if (!group) {
      group = { produto: item.produto, items: [] }
      groups.push(group)
    }
    group.items.push(item)
  }

  // "SKU" aqui conta cada preço vendável separadamente — colchão, base
  // box e conjunto são itens distintos (dá pra vender cada um sozinho),
  // não só a combinação produto+tamanho.
  function countSkus(list) {
    return list.reduce(
      (s, i) => s + (i.pillow != null) + (i.colchao != null) + (i.base_box != null) + (i.conjunto != null),
      0
    )
  }
  const totalSkus = countSkus(filtered)

  return (
    <div>
      <div className="flex justify-between items-end flex-wrap gap-4 mb-6 border-b border-border pb-5">
        <div>
          <h1 className="font-display text-3xl font-semibold m-0">Tabela de Preços</h1>
          <div className="text-xs text-muted mt-1.5">
            {validade && <>Válida até {fmtDateShort(validade)} · </>}
            {groups.length} produto{groups.length !== 1 ? 's' : ''} · {filtered.length} tamanho{filtered.length !== 1 ? 's' : ''} · {totalSkus} SKUs
          </div>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <input
            className="bg-panel text-white border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="Buscar produto…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            onClick={() => setModalOpen(true)}
            className="bg-accent text-[#0B1524] rounded-lg px-4 py-2 text-sm font-semibold hover:brightness-110"
          >
            Atualizar tabela
          </button>
        </div>
      </div>

      {loading && <div className="text-muted text-sm">Carregando…</div>}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 text-muted">
          <p className="font-display text-xl text-white mb-2">Nenhuma tabela de preços cadastrada ainda</p>
          <p className="mb-5">Envie o PDF da tabela de representantes pra começar.</p>
          <button onClick={() => setModalOpen(true)} className="bg-accent text-[#0B1524] rounded-lg px-4 py-2 text-sm font-semibold">
            Enviar tabela
          </button>
        </div>
      )}

      <div className="space-y-4">
        {groups.map((group) => {
          const hasPillow = group.items.some((i) => i.pillow != null)
          const hasBaseBox = group.items.some((i) => i.base_box != null)
          return (
            <div key={group.produto} className="rounded-xl border border-border overflow-x-auto bg-panel">
              <div className="min-w-[680px]">
                <div className="px-5 py-3 border-b border-border bg-panel2 flex items-center justify-between gap-4 flex-wrap">
                  <span className="font-semibold text-sm">
                    {group.produto} <span className="text-muted font-normal text-xs">· {countSkus(group.items)} SKUs</span>
                  </span>
                  {group.items[0]?.cores ? (
                    <span className="text-muted text-xs">{group.items[0].cores}</span>
                  ) : (
                    <span className="text-muted text-xs italic">cores não cadastradas</span>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-muted border-b border-border">
                      <th className="text-left font-medium px-5 py-3">Tamanho</th>
                      {hasPillow && <th className="text-right font-medium px-5 py-3">Pillow</th>}
                      <th className="text-right font-medium px-5 py-3">Colchão</th>
                      {hasBaseBox && <th className="text-right font-medium px-5 py-3">Base Box</th>}
                      <th className="text-right font-medium px-5 py-3">Conjunto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-b-0">
                        <td className="px-5 py-3 font-mono text-xs">{item.tamanho}</td>
                        {hasPillow && (
                          <td className="text-right px-5 py-3 font-mono">{item.pillow != null ? fmtBRL(item.pillow) : '—'}</td>
                        )}
                        <td className="text-right px-5 py-3 font-mono">
                          {fmtBRL(item.colchao)}
                          {item.colchao_altura && <span className="text-muted text-[10px] ml-1">({item.colchao_altura})</span>}
                        </td>
                        {hasBaseBox && (
                          <td className="text-right px-5 py-3 font-mono">
                            {item.base_box != null ? fmtBRL(item.base_box) : '—'}
                          </td>
                        )}
                        <td className="text-right px-5 py-3 font-mono">
                          {fmtBRL(item.conjunto)}
                          {item.conjunto_altura && <span className="text-muted text-[10px] ml-1">({item.conjunto_altura})</span>}
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

      {modalOpen && (
        <UploadPrecosModal
          onClose={() => setModalOpen(false)}
          onDone={async () => {
            await load()
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
