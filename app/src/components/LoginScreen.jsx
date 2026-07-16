import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) setError('E-mail ou senha incorretos.')
  }

  return (
    <div className="min-h-screen bg-bg text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-panel border border-border rounded-2xl p-7"
      >
        <div className="text-[11px] tracking-widest uppercase text-accent font-semibold mb-1.5">
          Grupo Ley · Colchões
        </div>
        <h1 className="font-display text-2xl font-semibold mb-6">Diretoria Comercial</h1>

        <label className="block text-xs text-muted mb-1.5">E-mail</label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#0B1524] border border-border rounded-lg px-3 py-2 text-sm mb-4"
          placeholder="voce@grupoley.com.br"
        />

        <label className="block text-xs text-muted mb-1.5">Senha</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#0B1524] border border-border rounded-lg px-3 py-2 text-sm mb-5"
          placeholder="••••••••"
        />

        {error && (
          <div className="text-coral bg-coral/10 rounded-lg px-3 py-2.5 text-sm mb-4">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-[#0B1524] rounded-lg px-4 py-2.5 text-sm font-semibold hover:brightness-110 disabled:opacity-60"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
