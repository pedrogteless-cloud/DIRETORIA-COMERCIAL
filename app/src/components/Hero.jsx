import { fmtBRL } from '../lib/format'

function DeltaBadge({ current, previous }) {
  if (previous === null || previous === undefined) return null
  if (previous === 0) return <span className="delta-tag text-teal bg-teal/10">+novo</span>
  const pct = ((current - previous) / previous) * 100
  const cls = pct > 0.5 ? 'text-teal bg-teal/10' : pct < -0.5 ? 'text-coral bg-coral/10' : 'text-muted bg-white/5'
  const arrow = pct > 0.5 ? '▲' : pct < -0.5 ? '▼' : '•'
  return <span className={`delta-tag ml-2 ${cls}`}>{arrow} {Math.abs(pct).toFixed(0)}%</span>
}

function fmtDateShort(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default function Hero({
  label,
  totalCommission,
  prevTotalCommission,
  vendorCount,
  exclusionsCount,
  totalNet,
  avg,
  totalCarteiraPotencial,
  carteiraDate,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-7">
      <div className="rounded-xl p-6 border border-accent/25 bg-gradient-to-br from-panel2 to-panel lg:col-span-1">
        <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Total pago em comissão</div>
        <div className="font-display text-3xl font-semibold text-accent">{fmtBRL(totalCommission)}</div>
        <div className="text-xs text-muted mt-1.5">
          {label} <DeltaBadge current={totalCommission} previous={prevTotalCommission} />
        </div>
      </div>
      <div className="rounded-xl p-6 border border-border bg-panel">
        <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Carteira pendente</div>
        <div className="font-display text-[22px] font-semibold">{fmtBRL(totalCarteiraPotencial)}</div>
        <div className="text-xs text-muted mt-1.5">
          comissão potencial · carteira de {fmtDateShort(carteiraDate)}
        </div>
      </div>
      <div className="rounded-xl p-6 border border-border bg-panel">
        <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Vendedores no ranking</div>
        <div className="font-display text-[22px] font-semibold">{vendorCount}</div>
        <div className="text-xs text-muted mt-1.5">excluídos: {exclusionsCount}</div>
      </div>
      <div className="rounded-xl p-6 border border-border bg-panel">
        <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Vendido líquido</div>
        <div className="font-display text-[22px] font-semibold">{fmtBRL(totalNet)}</div>
      </div>
      <div className="rounded-xl p-6 border border-border bg-panel">
        <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Comissão média</div>
        <div className="font-display text-[22px] font-semibold">{fmtBRL(avg)}</div>
      </div>
    </div>
  )
}
