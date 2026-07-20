import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fmtBRL } from '../lib/format'
import PromocaoModal from './PromocaoModal'

export default function PromocaoBanner() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('tabela_promocional').select('*').order('produto').order('tamanho')
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return null

  const campanha = items[0]?.campanha
  const groups = []
  for (const item of items) {
    let group = groups.find((g) => g.produto === item.produto)
    if (!group) {
      group = { produto: item.produto, items: [] }
      groups.push(group)
    }
    group.items.push(item)
  }

  return (
    <div className="rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-panel mb-7 overflow-hidden">
      <div className="flex justify-between items-center flex-wrap gap-3 px-5 py-4 border-b border-amber-400/20">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-amber-400 font-semibold">🎁 Promoção ativa</div>
          <h2 className="font-display text-xl font-semibold m-0 mt-0.5">
            {campanha || 'Nenhuma promoção cadastrada'}
          </h2>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="border border-amber-400/40 text-amber-300 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-400/10"
        >
          Gerenciar promoção
        </button>
      </div>

      {groups.length === 0 && (
        <div className="px-5 py-6 text-center text-muted text-sm">
          Nenhuma promoção cadastrada no momento. Catálogos promocionais (ex: Dia dos Pais) são peças de
          marketing — cadastre os preços manualmente aqui, já que não dá pra ler os valores automaticamente
          de um PDF desenhado como esse.
        </div>
      )}

      {groups.length > 0 && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {groups.map((group) => {
            const hasBaseBox = group.items.some((i) => i.base_box != null)
            return (
              <div key={group.produto} className="rounded-lg border border-border bg-panel/60 overflow-x-auto">
                <div className="min-w-[420px]">
                  <div className="px-4 py-2.5 border-b border-border bg-panel2 flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{group.produto}</span>
                    {group.items[0]?.cores && <span className="text-muted text-[11px]">{group.items[0].cores}</span>}
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-wide text-muted border-b border-border">
                        <th className="text-left font-medium px-4 py-2">Tamanho</th>
                        <th className="text-right font-medium px-4 py-2">Colchão</th>
                        {hasBaseBox && <th className="text-right font-medium px-4 py-2">Base Box</th>}
                        <th className="text-right font-medium px-4 py-2">Conjunto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item) => (
                        <tr key={item.id} className="border-b border-border last:border-b-0">
                          <td className="px-4 py-2 font-mono">{item.tamanho}</td>
                          <td className="text-right px-4 py-2 font-mono text-amber-300">
                            {item.colchao != null ? fmtBRL(item.colchao) : '—'}
                          </td>
                          {hasBaseBox && (
                            <td className="text-right px-4 py-2 font-mono text-amber-300">
                              {item.base_box != null ? fmtBRL(item.base_box) : '—'}
                            </td>
                          )}
                          <td className="text-right px-4 py-2 font-mono text-amber-300">
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
      )}

      {modalOpen && (
        <PromocaoModal
          campanha={campanha}
          items={items}
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
