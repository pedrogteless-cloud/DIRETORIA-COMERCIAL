import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PinLogin({ onSuccess }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function entrar() {
    const clean = pin.trim()
    if (!clean) return
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('checar_acesso_representante', { p_pin: clean })
    setLoading(false)
    if (err) {
      setError('Erro ao validar. Tente de novo.')
      return
    }
    const rep = data && data[0]
    if (!rep) {
      setError('PIN inválido ou acesso desativado. Fale com a diretoria comercial.')
      return
    }
    localStorage.setItem('rep_pin', clean)
    onSuccess(rep)
  }

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[11px] tracking-widest uppercase text-accent font-semibold mb-1.5">
            Ley Colchões
          </div>
          <h1 className="font-display text-3xl font-semibold">Portal do Representante</h1>
          <p className="text-muted text-sm mt-2">Digite seu PIN de acesso pra ver o material, a tabela e as promoções.</p>
        </div>

        <input
          inputMode="numeric"
          autoFocus
          className="w-full bg-panel border border-border rounded-xl px-4 py-3.5 text-center text-2xl font-mono tracking-[0.3em] mb-3"
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && entrar()}
        />

        {error && <div className="text-coral text-sm text-center mb-3">{error}</div>}

        <button
          onClick={entrar}
          disabled={loading || !pin.trim()}
          className="w-full bg-accent text-[#0B1524] rounded-xl px-4 py-3.5 text-base font-semibold hover:brightness-110 disabled:opacity-50"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}
