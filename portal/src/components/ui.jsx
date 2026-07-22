// Pequenos blocos de UI reaproveitados no portal, pra manter os estados de
// carregamento/vazio consistentes entre as telas.

export function Spinner({ label = 'Carregando…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted text-sm" role="status" aria-live="polite">
      <span className="inline-block w-4 h-4 border-2 border-muted/40 border-t-accent rounded-full animate-spin" />
      {label}
    </div>
  )
}

export function EmptyState({ titulo, children }) {
  return (
    <div className="text-center py-16 text-muted">
      {titulo && <p className="font-display text-lg text-white mb-2">{titulo}</p>}
      {children && <p className="text-sm">{children}</p>}
    </div>
  )
}
