import { useState } from 'react'
import { extractPdfText } from '../lib/extractPdfText'
import { parseTabelaPrecosText } from '../lib/parseTabelaPrecos'
import { supabase } from '../lib/supabaseClient'

export default function UploadPrecosModal({ onClose, onDone }) {
  const [status, setStatus] = useState('idle') // idle | reading | preview | saving | error
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(null) // { validade, items }

  async function handleFile(file) {
    setStatus('reading')
    setMessage('')
    try {
      const text = await extractPdfText(file)
      const result = parseTabelaPrecosText(text)
      if (result.error) {
        setStatus('error')
        setMessage(result.error)
        return
      }
      setPreview(result)
      setStatus('preview')
    } catch (err) {
      setStatus('error')
      setMessage('Erro ao ler o PDF: ' + (err.message || String(err)))
    }
  }

  async function handleDrop(e) {
    e.preventDefault()
    const file = Array.from(e.dataTransfer.files).find((f) => f.type === 'application/pdf')
    if (file) handleFile(file)
  }

  async function confirmReplace() {
    setStatus('saving')
    try {
      const { error: delErr } = await supabase
        .from('tabela_precos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (delErr) throw delErr

      const rows = preview.items.map((item) => ({ ...item, validade: preview.validade }))
      const { error: insErr } = await supabase.from('tabela_precos').insert(rows)
      if (insErr) throw insErr

      onDone()
    } catch (err) {
      setStatus('error')
      setMessage('Erro ao salvar: ' + (err.message || String(err)))
    }
  }

  const produtos = preview ? [...new Set(preview.items.map((i) => i.produto))] : []

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-lg">
        <h3 className="font-display text-xl mb-1.5">Atualizar tabela de preços</h3>
        <p className="text-muted text-sm mb-4 leading-relaxed">
          Envie o PDF novo da tabela de representantes. Isso <span className="text-coral">substitui completamente</span> a
          tabela atual — não fica histórico de tabelas antigas.
        </p>

        {(status === 'idle' || status === 'reading' || status === 'error') && (
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="block border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-white/[0.02]"
          >
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
            />
            <span className="text-sm text-muted">
              {status === 'reading' ? 'Lendo PDF…' : 'Clique ou arraste o PDF da tabela aqui'}
            </span>
          </label>
        )}

        {status === 'error' && (
          <div className="text-coral bg-coral/10 rounded-lg px-3 py-2.5 text-sm mt-3">{message}</div>
        )}

        {status === 'preview' && preview && (
          <div className="border border-border rounded-lg p-4 text-sm">
            <div className="mb-2">
              <span className="text-muted">Válido até:</span>{' '}
              {preview.validade.split('-').reverse().join('/')}
            </div>
            <div className="mb-3">
              <span className="text-muted">{produtos.length} produtos</span> · {preview.items.length} linhas de preço
            </div>
            <div className="max-h-40 overflow-y-auto text-xs text-muted space-y-0.5">
              {produtos.map((p) => (
                <div key={p}>{p}</div>
              ))}
            </div>
          </div>
        )}

        {status === 'saving' && <div className="text-muted text-sm py-4 text-center">Substituindo tabela…</div>}

        <div className="flex justify-end gap-2.5 mt-5">
          <button onClick={onClose} className="border border-border text-muted rounded-lg px-4 py-2 text-sm hover:bg-white/5">
            Fechar
          </button>
          {status === 'preview' && (
            <button
              onClick={confirmReplace}
              className="bg-coral text-white rounded-lg px-4 py-2 text-sm font-semibold hover:brightness-110"
            >
              Substituir tabela atual
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
