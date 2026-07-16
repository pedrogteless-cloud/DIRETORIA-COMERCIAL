const LOJA_OPTIONS = [
  { value: 'combinado', label: 'Combinado' },
  { value: 'COLCH', label: 'Matriz' },
  { value: 'COLTIM', label: 'Filial' },
]

export default function Header({
  periods,
  selectedId,
  onSelect,
  viewLoja,
  onChangeViewLoja,
  onOpenUpload,
  onOpenExclusions,
  onOpenCalendario,
  onLogout,
}) {
  return (
    <div className="flex justify-between items-end flex-wrap gap-4 mb-6 border-b border-border pb-5">
      <div>
        <div className="text-[11px] tracking-widest uppercase text-accent font-semibold mb-1.5">
          Grupo Ley · Colchões
        </div>
        <h1 className="font-display text-3xl font-semibold m-0">Diretoria Comercial</h1>
      </div>
      <div className="flex gap-2.5 items-center flex-wrap">
        <div className="flex border border-border rounded-lg overflow-hidden">
          {LOJA_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChangeViewLoja(opt.value)}
              className={`px-3 py-2 text-xs font-medium ${
                viewLoja === opt.value ? 'bg-accent text-[#0B1524]' : 'text-muted hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {periods.length > 0 && (
          <select
            className="bg-panel text-white border border-border rounded-lg px-3 py-2 font-mono text-sm"
            value={selectedId ?? ''}
            onChange={(e) => onSelect(e.target.value)}
          >
            {periods
              .slice()
              .reverse()
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.data_inicio.split('-').reverse().slice(0, 2).reverse().join('/')} –{' '}
                  {p.data_fim.split('-').reverse().join('/')}
                </option>
              ))}
          </select>
        )}
        <button
          onClick={onOpenCalendario}
          className="border border-border text-muted rounded-lg px-4 py-2 text-sm hover:bg-white/5"
        >
          Calendário
        </button>
        <button
          onClick={onOpenExclusions}
          className="border border-border text-muted rounded-lg px-4 py-2 text-sm hover:bg-white/5"
        >
          Vendedores ocultos
        </button>
        <button
          onClick={onOpenUpload}
          className="bg-accent text-[#0B1524] rounded-lg px-4 py-2 text-sm font-semibold hover:brightness-110"
        >
          + Novos relatórios
        </button>
        <button
          onClick={onLogout}
          className="text-muted hover:text-coral text-sm px-2"
          title="Sair"
        >
          Sair
        </button>
      </div>
    </div>
  )
}
