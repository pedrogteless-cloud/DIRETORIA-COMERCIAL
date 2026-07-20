import { useState } from 'react'
import { fmtBRL, fmtPct } from '../lib/format'

function Sparkline({ history }) {
  if (history.length < 2) return <span className="text-muted text-[11px]">—</span>
  const vals = history.map((h) => h.commission)
  const max = Math.max(...vals)
  const min = Math.min(...vals)
  const range = max - min || 1
  const w = 56
  const h = 22
  const pad = 2
  const pts = vals
    .map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (w - 2 * pad)
      const y = h - pad - ((v - min) / range) * (h - 2 * pad)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke="#4C8FE0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DeltaBadge({ current, previous }) {
  if (previous === null || previous === undefined) return <span className="delta-tag text-muted bg-white/5">novo</span>
  if (previous === 0) return <span className="delta-tag text-teal bg-teal/10">+novo</span>
  const pct = ((current - previous) / previous) * 100
  const cls = pct > 0.5 ? 'text-teal bg-teal/10' : pct < -0.5 ? 'text-coral bg-coral/10' : 'text-muted bg-white/5'
  const arrow = pct > 0.5 ? '▲' : pct < -0.5 ? '▼' : '•'
  return <span className={`delta-tag ${cls}`}>{arrow} {Math.abs(pct).toFixed(0)}%</span>
}

const ROW_GRID = 'grid-cols-[30px_minmax(0,1fr)_56px_82px_100px_100px_78px_24px]'
const LOJA_LABELS = {
  COLCH: 'Matriz',
  COLTIM: 'Filial',
}

function FactoryShareLine({ shares }) {
  const text = Object.entries(shares || {})
    .map(([loja, share]) => `${LOJA_LABELS[loja] || loja} ${fmtPct(share)}`)
    .join(' · ')
  return text ? <>{text}</> : <>Sem produção líquida</>
}

export default function Leaderboard({ vendors, historyByCode, prevByCode, carteiraByCode }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="rounded-xl border border-border overflow-x-auto bg-panel">
      <div className="min-w-[880px]">
        <div className={`grid ${ROW_GRID} items-center gap-4 px-5 py-3 border-b border-border text-[10px] uppercase tracking-wide text-muted`}>
          <div />
          <div>Vendedor</div>
          <div className="text-center">Tendência</div>
          <div className="text-right">Part. prod.</div>
          <div className="text-right">Comissão paga</div>
          <div className="text-right">Carteira pendente</div>
          <div />
          <div />
        </div>
        {vendors.map((v, i) => {
          const history = historyByCode[v.code] || []
          const prevVal = prevByCode ? prevByCode[v.code] ?? null : null
          const isOpen = expanded === v.code
          const carteira = carteiraByCode ? carteiraByCode[v.code] : null
          return (
            <div key={v.code}>
              <div
                onClick={() => setExpanded(isOpen ? null : v.code)}
                className={`grid ${ROW_GRID} items-center gap-4 px-5 py-4 border-b border-border cursor-pointer hover:bg-white/[0.02] last:border-b-0`}
              >
                <div className={`font-display italic text-lg ${i === 0 ? 'text-accent' : 'text-muted'}`}>{i + 1}</div>
                <div>
                  <div className="font-semibold text-sm">
                    {v.name} <span className="text-muted font-mono text-[11px]">#{v.code}</span>
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {fmtBRL(v.vendas_liquidas)} · <FactoryShareLine shares={v.productionShareByLoja} />
                  </div>
                  <div className="h-1.5 rounded bg-white/5 overflow-hidden mt-1.5">
                    <div className="h-full rounded bg-gradient-to-r from-accent to-teal" style={{ width: `${v.productionShare}%` }} />
                  </div>
                </div>
                <div className="flex justify-center"><Sparkline history={history} /></div>
                <div className="font-mono font-semibold text-sm text-right text-teal">{fmtPct(v.productionShare)}</div>
                <div className="font-mono font-semibold text-sm text-right">{fmtBRL(v.commission)}</div>
                <div className="font-mono text-sm text-right text-muted">
                  {carteira ? fmtBRL(carteira.comissao_potencial) : '—'}
                </div>
                <div><DeltaBadge current={v.commission} previous={prevVal} /></div>
                <div className="text-center text-muted text-xs">{isOpen ? '▲' : '▼'}</div>
              </div>
              {isOpen && (
                <div className="bg-panel2 border-t border-dashed border-border px-5 py-5 text-sm text-muted grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-white font-semibold mb-2">Histórico de comissão</div>
                  <table className="w-full font-mono text-xs">
                    <tbody>
                      {history
                        .slice()
                        .reverse()
                        .map((h) => (
                          <tr key={h.label} className="border-b border-border">
                            <td className="py-1.5 text-muted">{h.label}</td>
                            <td className="py-1.5 text-right text-white">{fmtBRL(h.commission)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <div className="text-white font-semibold mb-2">Detalhe da quinzena atual</div>
                  <table className="w-full font-mono text-xs">
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-1.5 text-muted">Vendas líquidas</td>
                        <td className="py-1.5 text-right text-white">{fmtBRL(v.vendas_liquidas)}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1.5 text-muted">Participação na produção</td>
                        <td className="py-1.5 text-right text-teal">{fmtPct(v.productionShare)}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1.5 text-muted">Vendas brutas</td>
                        <td className="py-1.5 text-right text-white">{fmtBRL(v.vendas_brutas)}</td>
                      </tr>
                    </tbody>
                  </table>
                  {Object.keys(v.productionShareByLoja || {}).length > 0 && (
                    <>
                      <div className="text-white font-semibold mt-4 mb-2">Participação por fábrica</div>
                      <table className="w-full font-mono text-xs">
                        <tbody>
                          {Object.entries(v.producaoPorLoja || {}).map(([loja, value]) => (
                            <tr key={loja} className="border-b border-border">
                              <td className="py-1.5 text-muted">{LOJA_LABELS[loja] || loja}</td>
                              <td className="py-1.5 text-right text-white">{fmtBRL(value)}</td>
                              <td className="py-1.5 text-right text-teal">{fmtPct(v.productionShareByLoja[loja])}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
                <div>
                  <div className="text-white font-semibold mb-2">Carteira pendente (atual)</div>
                  {carteira ? (
                    <table className="w-full font-mono text-xs">
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-1.5 text-muted">Valor não faturado</td>
                          <td className="py-1.5 text-right text-white">{fmtBRL(carteira.valor_pendente)}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-1.5 text-muted">Comissão potencial</td>
                          <td className="py-1.5 text-right text-white">{fmtBRL(carteira.comissao_potencial)}</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs">Sem carteira pendente registrada para esse vendedor.</p>
                  )}
                </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
