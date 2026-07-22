import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import PinLogin from './components/PinLogin'
import MateriaisView from './components/MateriaisView'
import PrecosView from './components/PrecosView'
import PromocaoView from './components/PromocaoView'
import PedidoView from './components/PedidoView'

const TABS = [
  { value: 'pedido', label: 'Pedido', icon: '📝' },
  { value: 'materiais', label: 'Materiais', icon: '📷' },
  { value: 'precos', label: 'Tabela', icon: '🏷️' },
  { value: 'promocao', label: 'Promoção', icon: '🎁' },
]

export default function App() {
  const [rep, setRep] = useState(undefined) // undefined = checando, null = deslogado
  const [tab, setTab] = useState('pedido')

  // Revalida o PIN salvo a cada abertura — se o diretor desativou o acesso,
  // o rep cai pra tela de PIN mesmo tendo o PIN guardado no celular.
  useEffect(() => {
    const saved = localStorage.getItem('rep_pin')
    if (!saved) {
      setRep(null)
      return
    }
    supabase.rpc('checar_acesso_representante', { p_pin: saved }).then(({ data }) => {
      const r = data && data[0]
      if (r) setRep(r)
      else {
        localStorage.removeItem('rep_pin')
        setRep(null)
      }
    })
  }, [])

  function sair() {
    localStorage.removeItem('rep_pin')
    setRep(null)
  }

  if (rep === undefined) return <div className="min-h-screen bg-bg" />
  if (!rep) return <PinLogin onSuccess={setRep} />

  return (
    <div className="min-h-screen bg-bg text-white" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <div className="max-w-2xl mx-auto p-5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-[11px] tracking-widest uppercase text-accent font-semibold">Ley Colchões</div>
            <div className="font-display text-xl font-semibold">Olá, {rep.nome.split(' ')[0]}</div>
          </div>
          <button onClick={sair} className="text-muted hover:text-coral text-sm px-2">
            Sair
          </button>
        </div>

        {tab === 'pedido' && <PedidoView representante={rep} />}
        {tab === 'materiais' && <MateriaisView />}
        {tab === 'precos' && <PrecosView />}
        {tab === 'promocao' && <PromocaoView />}
      </div>

      <nav
        className="fixed bottom-0 inset-x-0 bg-panel border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              aria-current={tab === t.value ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-3 text-xs font-medium ${
                tab === t.value ? 'text-accent' : 'text-muted'
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
