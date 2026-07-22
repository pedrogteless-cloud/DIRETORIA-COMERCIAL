const TABS = [
  { value: 'vendedores', label: 'Gestão de Vendedores' },
  { value: 'portal', label: 'Portal do Representante' },
]

export default function TabNav({ active, onChange, onLogout }) {
  return (
    <div className="flex justify-between items-center flex-wrap gap-4 mb-5">
      <div>
        <div className="text-[11px] tracking-widest uppercase text-accent font-semibold mb-1.5">
          Grupo Ley · Colchões
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onChange(tab.value)}
              className={`px-4 py-2 text-sm font-medium ${
                active === tab.value ? 'bg-accent text-[#0B1524]' : 'text-muted hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onLogout} className="text-muted hover:text-coral text-sm px-2" title="Sair">
        Sair
      </button>
    </div>
  )
}
