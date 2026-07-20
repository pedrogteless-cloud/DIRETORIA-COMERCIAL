import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

let nextId = 1
function blankRow() {
  return { key: nextId++, produto: '', tamanho: '', colchao: '', base_box: '', conjunto: '', cores: '' }
}

function toRow(item) {
  return {
    key: nextId++,
    produto: item.produto,
    tamanho: item.tamanho,
    colchao: item.colchao ?? '',
    base_box: item.base_box ?? '',
    conjunto: item.conjunto ?? '',
    cores: item.cores ?? '',
  }
}

// Catálogos promocionais (ex: Dia dos Pais) são peças de marketing feitas no
// Canva — os preços existem como texto no PDF, mas os rótulos de produto e
// tamanho são desenho, não texto, então não dá pra extrair automaticamente
// como fazemos com a tabela de representantes (essa vem de planilha). Por
// isso aqui é lançamento manual em vez de upload de PDF.
export default function PromocaoModal({ campanha, items, onClose, onDone }) {
  const [nome, setNome] = useState(campanha || '')
  const [rows, setRows] = useState(items && items.length > 0 ? items.map(toRow) : [blankRow()])
  const [status, setStatus] = useState('idle') // idle | saving | error
  const [message, setMessage] = useState('')

  function updateRow(key, field, value) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
  }

  function addRow() {
    setRows((rs) => [...rs, blankRow()])
  }

  function removeRow(key) {
    setRows((rs) => rs.filter((r) => r.key !== key))
  }

  function num(v) {
    if (v === '' || v === null || v === undefined) return null
    const n = parseFloat(String(v).replace(',', '.'))
    return isNaN(n) ? null : n
  }

  async function save() {
    if (!nome.trim()) {
      setStatus('error')
      setMessage('Dê um nome pra promoção (ex: "Dia dos Pais 2026").')
      return
    }
    const validRows = rows.filter((r) => r.produto.trim() && r.tamanho.trim())
    if (validRows.length === 0) {
      setStatus('error')
      setMessage('Adicione pelo menos um produto com tamanho.')
      return
    }

    setStatus('saving')
    try {
      const { error: delErr } = await supabase
        .from('tabela_promocional')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (delErr) throw delErr

      const payload = validRows.map((r) => ({
        campanha: nome.trim(),
        produto: r.produto.trim().toUpperCase(),
        tamanho: r.tamanho.trim().toUpperCase(),
        colchao: num(r.colchao),
        base_box: num(r.base_box),
        conjunto: num(r.conjunto),
        cores: r.cores.trim() || null,
      }))
      const { error: insErr } = await supabase.from('tabela_promocional').insert(payload)
      if (insErr) throw insErr

      onDone()
    } catch (err) {
      setStatus('error')
      setMessage('Erro ao salvar: ' + (err.message || String(err)))
    }
  }

  async function encerrar() {
    setStatus('saving')
    try {
      const { error } = await supabase.from('tabela_promocional').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
      onDone()
    } catch (err) {
      setStatus('error')
      setMessage('Erro ao encerrar: ' + (err.message || String(err)))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        <h3 className="font-display text-xl mb-1.5">Gerenciar promoção</h3>
        <p className="text-muted text-sm mb-4 leading-relaxed">
          Catálogos promocionais são peças gráficas (Canva) — os valores não saem automaticamente do PDF.
          Cadastre manualmente aqui; salvar <span className="text-coral">substitui a promoção atual por completo</span>.
        </p>

        <label className="block text-xs text-muted mb-1.5">Nome da campanha</label>
        <input
          className="w-full bg-panel2 text-white border border-border rounded-lg px-3 py-2 text-sm mb-4"
          placeholder="Dia dos Pais 2026"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <div className="space-y-2.5 mb-3">
          <div className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.7fr_1fr_auto] gap-2 text-[10px] uppercase tracking-wide text-muted px-1">
            <div>Produto</div>
            <div>Tamanho</div>
            <div>Colchão</div>
            <div>Base Box</div>
            <div>Conjunto</div>
            <div>Cores</div>
            <div></div>
          </div>
          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.7fr_1fr_auto] gap-2">
              <input
                className="bg-panel2 text-white border border-border rounded-lg px-2.5 py-1.5 text-sm"
                placeholder="AMÉRICA"
                value={row.produto}
                onChange={(e) => updateRow(row.key, 'produto', e.target.value)}
              />
              <input
                className="bg-panel2 text-white border border-border rounded-lg px-2.5 py-1.5 text-sm font-mono"
                placeholder="088X188"
                value={row.tamanho}
                onChange={(e) => updateRow(row.key, 'tamanho', e.target.value)}
              />
              <input
                className="bg-panel2 text-white border border-border rounded-lg px-2.5 py-1.5 text-sm font-mono"
                placeholder="310,00"
                value={row.colchao}
                onChange={(e) => updateRow(row.key, 'colchao', e.target.value)}
              />
              <input
                className="bg-panel2 text-white border border-border rounded-lg px-2.5 py-1.5 text-sm font-mono"
                placeholder="189,00"
                value={row.base_box}
                onChange={(e) => updateRow(row.key, 'base_box', e.target.value)}
              />
              <input
                className="bg-panel2 text-white border border-border rounded-lg px-2.5 py-1.5 text-sm font-mono"
                placeholder="499,00"
                value={row.conjunto}
                onChange={(e) => updateRow(row.key, 'conjunto', e.target.value)}
              />
              <input
                className="bg-panel2 text-white border border-border rounded-lg px-2.5 py-1.5 text-sm"
                placeholder="Cinza, Marrom"
                value={row.cores}
                onChange={(e) => updateRow(row.key, 'cores', e.target.value)}
              />
              <button
                onClick={() => removeRow(row.key)}
                className="text-muted hover:text-coral px-2 text-sm"
                title="Remover linha"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button onClick={addRow} className="text-accent text-sm hover:brightness-110 mb-4">
          + adicionar produto
        </button>

        {status === 'error' && (
          <div className="text-coral bg-coral/10 rounded-lg px-3 py-2.5 text-sm mb-3">{message}</div>
        )}

        <div className="flex justify-between items-center gap-2.5 mt-2 flex-wrap">
          <button
            onClick={encerrar}
            disabled={status === 'saving'}
            className="border border-coral/40 text-coral rounded-lg px-4 py-2 text-sm hover:bg-coral/10"
          >
            Encerrar promoção
          </button>
          <div className="flex gap-2.5">
            <button onClick={onClose} className="border border-border text-muted rounded-lg px-4 py-2 text-sm hover:bg-white/5">
              Fechar
            </button>
            <button
              onClick={save}
              disabled={status === 'saving'}
              className="bg-accent text-[#0B1524] rounded-lg px-4 py-2 text-sm font-semibold hover:brightness-110"
            >
              {status === 'saving' ? 'Salvando…' : 'Salvar promoção'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
