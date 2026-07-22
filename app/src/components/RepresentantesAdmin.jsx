import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function randomPin() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export default function RepresentantesAdmin() {
  const [reps, setReps] = useState([])
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [codigo, setCodigo] = useState('')
  const [pin, setPin] = useState(randomPin())
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('representantes').select('*').order('nome')
    setReps(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function addRep() {
    setError('')
    if (!nome.trim() || !pin.trim()) {
      setError('Nome e PIN são obrigatórios.')
      return
    }
    const { error: err } = await supabase.from('representantes').insert({
      nome: nome.trim(),
      codigo: codigo.trim() || null,
      pin: pin.trim(),
    })
    if (err) {
      setError(err.message.includes('duplicate') ? 'Esse PIN já está em uso por outro representante.' : err.message)
      return
    }
    setNome('')
    setCodigo('')
    setPin(randomPin())
    load()
  }

  async function toggleAtivo(rep) {
    await supabase.from('representantes').update({ ativo: !rep.ativo }).eq('id', rep.id)
    load()
  }

  async function remove(rep) {
    if (!confirm(`Remover o acesso de ${rep.nome}?`)) return
    await supabase.from('representantes').delete().eq('id', rep.id)
    load()
  }

  return (
    <div>
      <div className="rounded-xl border border-border bg-panel p-5 mb-6">
        <h3 className="font-display text-lg mb-3">Novo representante</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-2.5">
          <input
            className="bg-panel2 text-white border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <input
            className="bg-panel2 text-white border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="Código (opcional)"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <input
            className="bg-panel2 text-white border border-border rounded-lg px-3 py-2 text-sm font-mono"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          />
          <button
            onClick={addRep}
            className="bg-accent text-[#0B1524] rounded-lg px-4 py-2 text-sm font-semibold hover:brightness-110 whitespace-nowrap"
          >
            Adicionar
          </button>
        </div>
        {error && <div className="text-coral text-sm mt-2.5">{error}</div>}
      </div>

      {loading && <div className="text-muted text-sm">Carregando…</div>}

      {!loading && reps.length === 0 && (
        <div className="text-center py-10 text-muted text-sm">Nenhum representante cadastrado ainda.</div>
      )}

      {!loading && reps.length > 0 && (
        <div className="rounded-xl border border-border bg-panel overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_auto_auto] gap-3 px-5 py-3 border-b border-border text-[10px] uppercase tracking-wide text-muted">
              <div>Nome</div>
              <div>Código</div>
              <div>PIN</div>
              <div>Status</div>
              <div></div>
            </div>
            {reps.map((rep) => (
              <div
                key={rep.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_auto_auto] items-center gap-3 px-5 py-3 border-b border-border last:border-b-0"
              >
                <div className="text-sm font-semibold">{rep.nome}</div>
                <div className="text-muted text-sm">{rep.codigo || '—'}</div>
                <div className="font-mono text-sm">{rep.pin}</div>
                <div>
                  <button
                    onClick={() => toggleAtivo(rep)}
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      rep.ativo ? 'bg-teal/15 text-teal' : 'bg-white/5 text-muted'
                    }`}
                  >
                    {rep.ativo ? 'ativo' : 'inativo'}
                  </button>
                </div>
                <button onClick={() => remove(rep)} className="text-muted hover:text-coral text-sm px-2">
                  remover
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
