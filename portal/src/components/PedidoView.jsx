import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fmtBRL } from '../lib/format'
import SignaturePad from './SignaturePad'
import { enviarPedidoWhatsApp } from '../lib/enviarPedido'

const CAB_INICIAL = {
  razao_social: '',
  fantasia: '',
  cnpj: '',
  cgf: '',
  endereco: '',
  bairro: '',
  cep: '',
  cidade: '',
  estado: '',
  contato: '',
  telefone: '',
  whatsapp: '',
  email: '',
  local_entrega: '',
  prazo_pagamento: '',
  forma_pagamento: '',
  condicao_ley: '',
  observacoes: '',
}

let itemSeq = 1
function novoItem(extra = {}) {
  return { id: itemSeq++, qtd: '', descricao: '', preco_unitario: '', desconto: '', ...extra }
}

function Campo({ label, value, onChange, ...rest }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-muted mb-1">{label}</span>
      <input
        className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </label>
  )
}

export default function PedidoView({ representante }) {
  const [cab, setCab] = useState(CAB_INICIAL)
  const [itens, setItens] = useState([novoItem()])
  const [opcoes, setOpcoes] = useState({}) // label -> { descricao, preco }
  const [config, setConfig] = useState({})
  const [fabrica, setFabrica] = useState('eusebio')
  const [busca, setBusca] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState('')
  const repSig = useRef(null)
  const clienteSig = useRef(null)

  useEffect(() => {
    async function load() {
      const [{ data: precos }, { data: promo }, { data: cfg }] = await Promise.all([
        supabase.from('tabela_precos').select('*'),
        supabase.from('tabela_promocional').select('*'),
        supabase.from('configuracoes').select('*'),
      ])
      const map = {}
      const addRows = (rows, prefixo) => {
        for (const r of rows || []) {
          const comps = [
            ['Conjunto', r.conjunto],
            ['Colchão', r.colchao],
            ['Base Box', r.base_box],
            ['Pillow', r.pillow],
          ]
          for (const [nome, preco] of comps) {
            if (preco == null) continue
            const label = `${prefixo}${r.produto} ${r.tamanho} · ${nome} — ${fmtBRL(preco)}`
            map[label] = { descricao: `${prefixo}${r.produto} ${r.tamanho} - ${nome}`, preco }
          }
        }
      }
      addRows(precos, '')
      addRows(promo, '[PROMO] ')
      setOpcoes(map)
      setConfig(Object.fromEntries((cfg || []).map((c) => [c.chave, c.valor])))
    }
    load()
  }, [])

  const total = useMemo(
    () =>
      itens.reduce((s, it) => {
        const q = Number(it.qtd) || 0
        const u = Number(it.preco_unitario) || 0
        const d = Number(it.desconto) || 0
        return s + q * u * (1 - d / 100)
      }, 0),
    [itens]
  )

  function setField(campo, valor) {
    setCab((c) => ({ ...c, [campo]: valor }))
  }
  function setItem(id, campo, valor) {
    setItens((list) => list.map((it) => (it.id === id ? { ...it, [campo]: valor } : it)))
  }
  function addItemManual() {
    setItens((list) => [...list, novoItem()])
  }
  function removeItem(id) {
    setItens((list) => (list.length > 1 ? list.filter((it) => it.id !== id) : list))
  }
  function adicionarDaTabela() {
    const escolha = opcoes[busca]
    if (!escolha) {
      setMsg('Escolha um produto da lista pra adicionar, ou preencha um item na mão.')
      setTimeout(() => setMsg(''), 3000)
      return
    }
    setItens((list) => {
      const base = list.length === 1 && !list[0].descricao && !list[0].qtd ? [] : list
      return [...base, novoItem({ qtd: '1', descricao: escolha.descricao, preco_unitario: String(escolha.preco) })]
    })
    setBusca('')
  }

  // Carrega o gerador de PDF (jsPDF) sob demanda — assim as libs pesadas de
  // PDF ficam fora do bundle inicial e o portal abre rápido no celular.
  async function montarPdf() {
    const { gerarPedidoPdf } = await import('../lib/gerarPedidoPdf')
    return gerarPedidoPdf({
      cabecalho: cab,
      itens,
      assinaturaRep: repSig.current?.toDataURL() || null,
      assinaturaCliente: clienteSig.current?.toDataURL() || null,
      representante,
      total,
    })
  }

  function nomeArquivo() {
    const cliente = (cab.fantasia || cab.razao_social || 'cliente').replace(/[^\w]+/g, '_').slice(0, 30)
    const data = new Date().toISOString().slice(0, 10)
    return `pedido_${cliente}_${data}.pdf`
  }

  async function baixarPdf() {
    setMsg('')
    try {
      const doc = await montarPdf()
      doc.save(nomeArquivo())
    } catch (err) {
      setMsg('Erro ao gerar o PDF: ' + (err.message || String(err)))
    }
  }

  async function enviar() {
    setEnviando(true)
    setMsg('')
    try {
      const doc = await montarPdf()
      const blob = doc.output('blob')
      const numero = fabrica === 'timon' ? config.whatsapp_pedidos_timon : config.whatsapp_pedidos_eusebio
      const cliente = cab.fantasia || cab.razao_social || 'cliente'
      const texto = `Novo pedido — ${cliente}\nRepresentante: ${representante?.nome || ''}\nTotal: ${fmtBRL(total)}`
      const res = await enviarPedidoWhatsApp({ blob, fileName: nomeArquivo(), texto, numero })
      if (res.via === 'fallback') {
        setMsg('PDF baixado. Abri o WhatsApp — é só anexar o arquivo baixado na conversa da digitadora.')
      } else if (res.via === 'cancel') {
        setMsg('Envio cancelado.')
      } else {
        setMsg('Pedido compartilhado! Escolha a conversa da digitadora no WhatsApp.')
      }
    } catch (err) {
      setMsg('Erro ao gerar/enviar: ' + (err.message || String(err)))
    } finally {
      setEnviando(false)
    }
  }

  function limparTudo() {
    if (!confirm('Limpar o pedido inteiro e começar de novo?')) return
    setCab(CAB_INICIAL)
    setItens([novoItem()])
    repSig.current?.clear()
    clienteSig.current?.clear()
    setMsg('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Novo pedido</h2>
        <p className="text-muted text-sm">Preencha o que tiver — nada é obrigatório. No fim, gere o PDF e mande pra fábrica.</p>
      </div>

      {/* Dados do cliente */}
      <section className="rounded-xl border border-border bg-panel2/40 p-4">
        <h3 className="font-semibold text-sm mb-3">Dados do cliente</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="Razão social" value={cab.razao_social} onChange={(v) => setField('razao_social', v)} />
          <Campo label="Nome fantasia" value={cab.fantasia} onChange={(v) => setField('fantasia', v)} />
          <Campo label="CNPJ" value={cab.cnpj} onChange={(v) => setField('cnpj', v)} inputMode="numeric" />
          <Campo label="CGF / Inscrição estadual" value={cab.cgf} onChange={(v) => setField('cgf', v)} />
          <Campo label="Endereço" value={cab.endereco} onChange={(v) => setField('endereco', v)} />
          <Campo label="Bairro" value={cab.bairro} onChange={(v) => setField('bairro', v)} />
          <Campo label="CEP" value={cab.cep} onChange={(v) => setField('cep', v)} inputMode="numeric" />
          <Campo label="Cidade" value={cab.cidade} onChange={(v) => setField('cidade', v)} />
          <Campo label="Estado" value={cab.estado} onChange={(v) => setField('estado', v)} />
          <Campo label="Contato" value={cab.contato} onChange={(v) => setField('contato', v)} />
          <Campo label="Telefone" value={cab.telefone} onChange={(v) => setField('telefone', v)} inputMode="tel" />
          <Campo label="WhatsApp" value={cab.whatsapp} onChange={(v) => setField('whatsapp', v)} inputMode="tel" />
          <Campo label="E-mail" value={cab.email} onChange={(v) => setField('email', v)} inputMode="email" />
          <Campo label="Local de entrega" value={cab.local_entrega} onChange={(v) => setField('local_entrega', v)} />
        </div>
      </section>

      {/* Condições comerciais */}
      <section className="rounded-xl border border-border bg-panel2/40 p-4">
        <h3 className="font-semibold text-sm mb-3">Condições</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="Prazo de pagamento" value={cab.prazo_pagamento} onChange={(v) => setField('prazo_pagamento', v)} />
          <Campo label="Forma de pagamento" value={cab.forma_pagamento} onChange={(v) => setField('forma_pagamento', v)} />
          <Campo label="Condição Ley" value={cab.condicao_ley} onChange={(v) => setField('condicao_ley', v)} />
        </div>
      </section>

      {/* Itens do pedido */}
      <section className="rounded-xl border border-border bg-panel2/40 p-4">
        <h3 className="font-semibold text-sm mb-3">Itens do pedido</h3>

        <div className="flex gap-2 mb-4">
          <input
            list="produtos-tabela"
            className="flex-1 bg-panel border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="Buscar produto da tabela…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <datalist id="produtos-tabela">
            {Object.keys(opcoes).map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={adicionarDaTabela}
            className="bg-accent text-[#0B1524] rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap"
          >
            + tabela
          </button>
        </div>

        <div className="space-y-2.5">
          {itens.map((it) => {
            const sub = (Number(it.qtd) || 0) * (Number(it.preco_unitario) || 0) * (1 - (Number(it.desconto) || 0) / 100)
            return (
              <div key={it.id} className="rounded-lg border border-border bg-panel p-3">
                <div className="flex gap-2 mb-2">
                  <input
                    className="w-16 bg-panel2 border border-border rounded-lg px-2 py-1.5 text-sm text-center"
                    placeholder="Qtd"
                    inputMode="numeric"
                    value={it.qtd}
                    onChange={(e) => setItem(it.id, 'qtd', e.target.value.replace(/[^\d]/g, ''))}
                  />
                  <input
                    className="flex-1 bg-panel2 border border-border rounded-lg px-2 py-1.5 text-sm"
                    placeholder="Descrição do produto"
                    value={it.descricao}
                    onChange={(e) => setItem(it.id, 'descricao', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="text-muted hover:text-coral px-1.5 text-sm"
                    title="Remover item"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    className="w-28 bg-panel2 border border-border rounded-lg px-2 py-1.5 text-sm font-mono"
                    placeholder="Preço un."
                    inputMode="decimal"
                    value={it.preco_unitario}
                    onChange={(e) => setItem(it.id, 'preco_unitario', e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'))}
                  />
                  <input
                    className="w-20 bg-panel2 border border-border rounded-lg px-2 py-1.5 text-sm font-mono"
                    placeholder="Desc %"
                    inputMode="decimal"
                    value={it.desconto}
                    onChange={(e) => setItem(it.id, 'desconto', e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'))}
                  />
                  <span className="ml-auto text-sm font-mono text-teal">{fmtBRL(sub)}</span>
                </div>
              </div>
            )
          })}
        </div>

        <button type="button" onClick={addItemManual} className="text-accent text-sm mt-3 hover:brightness-110">
          + adicionar item em branco
        </button>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
          <span className="text-sm text-muted">Total do pedido</span>
          <span className="font-display text-xl font-semibold text-accent">{fmtBRL(total)}</span>
        </div>
      </section>

      {/* Observações */}
      <section className="rounded-xl border border-border bg-panel2/40 p-4">
        <h3 className="font-semibold text-sm mb-3">Observações</h3>
        <textarea
          className="w-full bg-panel border border-border rounded-lg px-3 py-2 text-sm min-h-[80px]"
          placeholder="Anotações do pedido…"
          value={cab.observacoes}
          onChange={(e) => setField('observacoes', e.target.value)}
        />
      </section>

      {/* Assinaturas */}
      <section className="rounded-xl border border-border bg-panel2/40 p-4">
        <h3 className="font-semibold text-sm mb-3">Assinaturas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SignaturePad ref={repSig} label="Representante" />
          <SignaturePad ref={clienteSig} label="Cliente" />
        </div>
      </section>

      {/* Envio */}
      <section className="rounded-xl border border-accent/30 bg-panel p-4">
        <h3 className="font-semibold text-sm mb-3">Enviar pedido</h3>
        <label className="block mb-3">
          <span className="block text-[11px] text-muted mb-1">Fábrica de destino</span>
          <select
            className="w-full bg-panel2 border border-border rounded-lg px-3 py-2 text-sm"
            value={fabrica}
            onChange={(e) => setFabrica(e.target.value)}
          >
            <option value="eusebio">Eusébio (matriz)</option>
            <option value="timon">Timon (filial)</option>
          </select>
        </label>

        {msg && <div className="text-sm text-teal bg-teal/10 rounded-lg px-3 py-2 mb-3">{msg}</div>}

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={enviar}
            disabled={enviando}
            className="flex-1 bg-teal text-[#0B1524] rounded-lg px-4 py-3 text-sm font-semibold hover:brightness-110 disabled:opacity-50"
          >
            {enviando ? 'Gerando…' : 'Enviar no WhatsApp'}
          </button>
          <button
            onClick={baixarPdf}
            className="border border-border text-white rounded-lg px-4 py-3 text-sm font-semibold hover:bg-white/5"
          >
            Baixar PDF
          </button>
        </div>
        <button onClick={limparTudo} className="text-muted hover:text-coral text-xs mt-3">
          limpar pedido
        </button>
      </section>
    </div>
  )
}
