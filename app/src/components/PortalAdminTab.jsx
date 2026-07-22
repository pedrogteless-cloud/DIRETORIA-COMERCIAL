import { useState } from 'react'
import PrecosTab from './PrecosTab'
import ProdutosAdmin from './ProdutosAdmin'
import RepresentantesAdmin from './RepresentantesAdmin'
import MateriaisAdmin from './MateriaisAdmin'
import ConfiguracoesAdmin from './ConfiguracoesAdmin'

// Centro de controle único do portal do representante: tudo que mantém o
// portal atualizado (preços, promoção, produtos/descrições, fotos, acessos
// e o WhatsApp de destino dos pedidos) fica aqui, numa navegação só.
const SECOES = [
  { value: 'precos', label: 'Preços & Promoção', icon: '🏷️', hint: 'tabela vigente e campanha ativa' },
  { value: 'produtos', label: 'Produtos', icon: '📦', hint: 'cores e descrições' },
  { value: 'materiais', label: 'Materiais', icon: '📷', hint: 'fotos e catálogos' },
  { value: 'representantes', label: 'Representantes', icon: '🔑', hint: 'acessos por PIN' },
  { value: 'config', label: 'Configurações', icon: '⚙️', hint: 'WhatsApp dos pedidos' },
]

export default function PortalAdminTab() {
  const [secao, setSecao] = useState('precos')
  const atual = SECOES.find((s) => s.value === secao)

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-3xl font-semibold m-0">Portal do Representante</h1>
        <div className="text-xs text-muted mt-1.5">
          Tudo que mantém o portal atualizado num lugar só. Os representantes acessam pelo app separado, com PIN.
        </div>
      </div>

      {/* Sub-navegação — rolável no celular */}
      <div className="-mx-1 overflow-x-auto mb-6">
        <div className="flex gap-2 px-1 w-max">
          {SECOES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSecao(s.value)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap border ${
                secao === s.value
                  ? 'bg-accent text-[#0B1524] border-accent'
                  : 'text-muted border-border hover:bg-white/5'
              }`}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {atual?.hint && <div className="text-[11px] uppercase tracking-wide text-muted mb-4">{atual.hint}</div>}

      {secao === 'precos' && <PrecosTab />}
      {secao === 'produtos' && <ProdutosAdmin />}
      {secao === 'materiais' && <MateriaisAdmin />}
      {secao === 'representantes' && <RepresentantesAdmin />}
      {secao === 'config' && <ConfiguracoesAdmin />}
    </div>
  )
}
