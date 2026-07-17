import { fmtBRL } from '../lib/format'

function fmtDateShort(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// O que cada representante ainda tem pra entregar (pedido lançado, não
// faturado), por fábrica — separado do ranking de comissão paga, que é
// outra métrica (mede a fábrica, não o vendedor; ver CONTEXT.md).
export default function CarteiraPendente({ rows, dateColch, dateColtim }) {
  const totalColch = rows.reduce((s, r) => s + r.colch, 0)
  const totalColtim = rows.reduce((s, r) => s + r.coltim, 0)
  const totalGeral = totalColch + totalColtim

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-7">
        <div className="rounded-xl p-5 border border-accent/25 bg-gradient-to-br from-panel2 to-panel">
          <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Total a entregar</div>
          <div className="font-display text-3xl font-semibold text-accent">{fmtBRL(totalGeral)}</div>
          <div className="text-xs text-muted mt-1.5">Eusébio + Timon, todos os representantes</div>
        </div>
        <div className="rounded-xl p-5 border border-border bg-panel">
          <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Eusébio (matriz)</div>
          <div className="font-display text-[22px] font-semibold">{fmtBRL(totalColch)}</div>
          <div className="text-xs text-muted mt-1.5">carteira de {fmtDateShort(dateColch)}</div>
        </div>
        <div className="rounded-xl p-5 border border-border bg-panel">
          <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Timon (filial)</div>
          <div className="font-display text-[22px] font-semibold">{fmtBRL(totalColtim)}</div>
          <div className="text-xs text-muted mt-1.5">carteira de {fmtDateShort(dateColtim)}</div>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-panel">
        <div className="grid grid-cols-[1fr_130px_130px_130px] items-center gap-3.5 px-4.5 py-2 border-b border-border text-[10px] uppercase tracking-wide text-muted">
          <div>Representante</div>
          <div className="text-right">Eusébio (matriz)</div>
          <div className="text-right">Timon (filial)</div>
          <div className="text-right">Total a entregar</div>
        </div>

        {rows.length === 0 && (
          <div className="px-4.5 py-6 text-center text-muted text-sm">Nenhuma carteira pendente registrada ainda.</div>
        )}

        {rows.map((r) => (
          <div
            key={r.codigo}
            className="grid grid-cols-[1fr_130px_130px_130px] items-center gap-3.5 px-4.5 py-3 border-b border-border last:border-b-0 hover:bg-white/[0.02]"
          >
            <div className="text-sm font-semibold">
              {r.nome} <span className="text-muted font-mono text-[11px]">#{r.codigo}</span>
            </div>
            <div className="text-right font-mono text-sm text-muted">{r.colch ? fmtBRL(r.colch) : '—'}</div>
            <div className="text-right font-mono text-sm text-muted">{r.coltim ? fmtBRL(r.coltim) : '—'}</div>
            <div className="text-right font-mono text-sm font-semibold text-accent">{fmtBRL(r.total)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
