import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ExclusionsModal({ exclusions, onClose, onChanged }) {
  const [input, setInput] = useState('')

  async function addExclusion() {
    const val = input.trim().toUpperCase()
    if (!val) return
    const { error } = await supabase.from('vendedores_ocultos').insert({ padrao: val })
    if (!error) {
      setInput('')
      onChanged()
    }
  }

  async function removeExclusion(id) {
    await supabase.from('vendedores_ocultos').delete().eq('id', id)
    onChanged()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-lg">
        <h3 className="font-display text-xl mb-1.5">Vendedores ocultos</h3>
        <p className="text-muted text-sm mb-4 leading-relaxed">
          Contas internas (como distribuidoras do próprio grupo) ficam de fora do ranking. Adicione um trecho do nome para ocultar.
        </p>
        <input
          className="w-full bg-[#0d1016] border border-border rounded-lg px-3 py-2 text-sm"
          placeholder="Ex: LEY MOVEIS"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addExclusion()}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {exclusions.map((ex) => (
            <span key={ex.id} className="bg-white/5 border border-border rounded-full px-2.5 py-1.5 text-xs flex items-center gap-1.5">
              {ex.padrao}
              <button onClick={() => removeExclusion(ex.id)} className="text-coral">✕</button>
            </span>
          ))}
        </div>
        <div className="flex justify-end gap-2.5 mt-5">
          <button onClick={onClose} className="border border-border text-muted rounded-lg px-4 py-2 text-sm hover:bg-white/5">
            Fechar
          </button>
          <button onClick={addExclusion} className="bg-accent text-[#0B1524] rounded-lg px-4 py-2 text-sm font-semibold">
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}
