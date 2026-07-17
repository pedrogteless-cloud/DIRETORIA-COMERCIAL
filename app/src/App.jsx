import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { periodLabel } from './lib/format'
import Header from './components/Header'
import Hero from './components/Hero'
import Leaderboard from './components/Leaderboard'
import UploadModal from './components/UploadModal'
import ExclusionsModal from './components/ExclusionsModal'
import CalendarModal from './components/CalendarModal'
import LoginScreen from './components/LoginScreen'
import TabNav from './components/TabNav'
import PrecosTab from './components/PrecosTab'
import CarteiraPendente from './components/CarteiraPendente'

// Supabase stores dates as YYYY-MM-DD; the UI works in DD/MM/YYYY.
function fmtDMY(isoDate) {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = ainda checando, null = deslogado
  const [periods, setPeriods] = useState([])
  const [commissions, setCommissions] = useState([]) // all comissoes_vendedor rows, all periods, all lojas
  const [exclusions, setExclusions] = useState([])
  const [carteiraSnapshots, setCarteiraSnapshots] = useState([])
  const [carteiraVendedor, setCarteiraVendedor] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [viewLoja, setViewLoja] = useState('combinado') // 'combinado' | 'COLCH' | 'COLTIM'
  const [modal, setModal] = useState(null) // 'upload' | 'exclusions' | 'calendario' | null
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('vendedores') // 'vendedores' | 'precos'

  async function loadAll() {
    setLoading(true)
    const [{ data: q }, { data: c }, { data: ex }, { data: cs }, { data: cv }] = await Promise.all([
      supabase.from('quinzenas').select('*').order('data_inicio'),
      supabase.from('comissoes_vendedor').select('*'),
      supabase.from('vendedores_ocultos').select('*'),
      supabase.from('carteira_snapshots').select('*'),
      supabase.from('carteira_vendedor').select('*'),
    ])
    setPeriods(q || [])
    setCommissions(c || [])
    setExclusions(ex || [])
    setCarteiraSnapshots(cs || [])
    setCarteiraVendedor(cv || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) loadAll()
  }, [session])

  const sortedPeriods = useMemo(
    () => periods.slice().sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio)),
    [periods]
  )

  useEffect(() => {
    if (!selectedId && sortedPeriods.length > 0) {
      setSelectedId(sortedPeriods[sortedPeriods.length - 1].id)
    }
  }, [sortedPeriods, selectedId])

  const exclusionPatterns = useMemo(() => exclusions.map((e) => e.padrao.toUpperCase()), [exclusions])
  const isExcluded = (nome) => exclusionPatterns.some((p) => nome.toUpperCase().includes(p))

  const selectedIndex = sortedPeriods.findIndex((p) => p.id === selectedId)
  const selectedPeriod = sortedPeriods[selectedIndex]
  const prevPeriod = selectedIndex > 0 ? sortedPeriods[selectedIndex - 1] : null

  // Groups comissoes_vendedor rows for one período into one row per vendedor,
  // respecting the loja filter — 'combinado' sums matriz + filial together.
  function vendorsForPeriod(periodId) {
    let rows = commissions.filter((c) => c.quinzena_id === periodId)
    if (viewLoja !== 'combinado') rows = rows.filter((r) => r.loja === viewLoja)

    const map = {}
    for (const r of rows) {
      if (!map[r.codigo]) {
        map[r.codigo] = {
          code: r.codigo,
          name: r.nome,
          commission: 0,
          vendas_liquidas: 0,
          vendas_brutas: 0,
          lojas: new Set(),
        }
      }
      map[r.codigo].commission += Number(r.comissao)
      map[r.codigo].vendas_liquidas += Number(r.vendas_liquidas)
      map[r.codigo].vendas_brutas += Number(r.vendas_brutas)
      map[r.codigo].lojas.add(r.loja)
    }
    return Object.values(map)
      .filter((v) => !isExcluded(v.name))
      .sort((a, b) => b.commission - a.commission)
  }

  const vendors = selectedPeriod ? vendorsForPeriod(selectedPeriod.id) : []
  const maxCommission = Math.max(...vendors.map((v) => v.commission), 1)
  const totalCommission = vendors.reduce((s, v) => s + v.commission, 0)
  const totalNet = vendors.reduce((s, v) => s + v.vendas_liquidas, 0)
  const avg = vendors.length ? totalCommission / vendors.length : 0

  const prevVendors = prevPeriod ? vendorsForPeriod(prevPeriod.id) : []
  const prevByCode = Object.fromEntries(prevVendors.map((v) => [v.code, v.commission]))
  const prevTotalCommission = prevPeriod ? prevVendors.reduce((s, v) => s + v.commission, 0) : null

  const historyByCode = useMemo(() => {
    const map = {}
    for (const p of sortedPeriods) {
      let rows = commissions.filter((c) => c.quinzena_id === p.id)
      if (viewLoja !== 'combinado') rows = rows.filter((r) => r.loja === viewLoja)
      const perCode = {}
      for (const r of rows) perCode[r.codigo] = (perCode[r.codigo] || 0) + Number(r.comissao)
      for (const [codigo, commission] of Object.entries(perCode)) {
        if (!map[codigo]) map[codigo] = []
        map[codigo].push({ label: periodLabel(fmtDMY(p.data_inicio), fmtDMY(p.data_fim)), commission })
      }
    }
    return map
  }, [sortedPeriods, commissions, viewLoja])

  // Carteira pendente (vendas digitadas ainda não faturadas): não é por
  // quinzena, é o snapshot mais recente tirado de cada loja.
  const latestSnapshotByLoja = useMemo(() => {
    const result = {}
    for (const s of carteiraSnapshots) {
      if (!result[s.loja] || s.data_relatorio > result[s.loja].data_relatorio) result[s.loja] = s
    }
    return result
  }, [carteiraSnapshots])

  const { carteiraByCode, carteiraDate, totalCarteiraPotencial } = useMemo(() => {
    const lojas = viewLoja === 'combinado' ? ['COLCH', 'COLTIM'] : [viewLoja]
    const map = {}
    let latestDate = null
    for (const loja of lojas) {
      const snap = latestSnapshotByLoja[loja]
      if (!snap) continue
      if (!latestDate || snap.data_relatorio > latestDate) latestDate = snap.data_relatorio
      const rows = carteiraVendedor.filter((cv) => cv.snapshot_id === snap.id)
      for (const r of rows) {
        if (!map[r.codigo]) map[r.codigo] = { valor_pendente: 0, comissao_potencial: 0 }
        map[r.codigo].valor_pendente += Number(r.valor_pendente)
        map[r.codigo].comissao_potencial += Number(r.comissao_potencial)
      }
    }
    const total = Object.values(map).reduce((s, v) => s + v.comissao_potencial, 0)
    return { carteiraByCode: map, carteiraDate: latestDate, totalCarteiraPotencial: total }
  }, [carteiraVendedor, latestSnapshotByLoja, viewLoja])

  // O que cada representante ainda tem pra entregar, por fábrica — sempre
  // mostra as duas (Eusébio/COLCH e Timon/COLTIM) lado a lado, independente
  // do filtro de loja usado no ranking de comissão.
  const carteiraPorRepresentante = useMemo(() => {
    const map = {}
    for (const [loja, snap] of Object.entries(latestSnapshotByLoja)) {
      const rows = carteiraVendedor.filter((cv) => cv.snapshot_id === snap.id)
      for (const r of rows) {
        if (isExcluded(r.nome)) continue
        if (!map[r.codigo]) map[r.codigo] = { codigo: r.codigo, nome: r.nome, colch: 0, coltim: 0 }
        map[r.codigo][loja === 'COLCH' ? 'colch' : 'coltim'] += Number(r.valor_pendente)
      }
    }
    return Object.values(map)
      .map((r) => ({ ...r, total: r.colch + r.coltim }))
      .sort((a, b) => b.total - a.total)
  }, [carteiraVendedor, latestSnapshotByLoja, exclusionPatterns])

  if (session === undefined) {
    return <div className="min-h-screen bg-bg" />
  }
  if (!session) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen bg-bg text-white p-7 max-w-5xl mx-auto">
      <TabNav active={activeTab} onChange={setActiveTab} onLogout={() => supabase.auth.signOut()} />

      {activeTab === 'precos' && <PrecosTab />}

      {activeTab === 'vendedores' && (
        <>
          <Header
            periods={sortedPeriods}
            selectedId={selectedId}
            onSelect={setSelectedId}
            viewLoja={viewLoja}
            onChangeViewLoja={setViewLoja}
            onOpenUpload={() => setModal('upload')}
            onOpenExclusions={() => setModal('exclusions')}
            onOpenCalendario={() => setModal('calendario')}
          />

          {loading && <div className="text-muted text-sm">Carregando…</div>}

          {!loading && sortedPeriods.length === 0 && (
            <div className="text-center py-16 text-muted">
              <p className="font-display text-xl text-white mb-2">Nenhuma quinzena salva ainda</p>
              <p className="mb-5">Envie os PDFs do relatório L2.3.28 para começar a acompanhar.</p>
              <button onClick={() => setModal('upload')} className="bg-accent text-[#0B1524] rounded-lg px-4 py-2 text-sm font-semibold">
                Enviar relatórios
              </button>
            </div>
          )}

          {!loading && selectedPeriod && (
            <>
              <Hero
                label={periodLabel(fmtDMY(selectedPeriod.data_inicio), fmtDMY(selectedPeriod.data_fim))}
                totalCommission={totalCommission}
                prevTotalCommission={prevTotalCommission}
                vendorCount={vendors.length}
                exclusionsCount={exclusions.length}
                totalNet={totalNet}
                avg={avg}
                totalCarteiraPotencial={totalCarteiraPotencial}
                carteiraDate={carteiraDate}
              />
              <div className="flex justify-between items-center text-xs uppercase tracking-wide text-muted mb-3 px-0.5">
                <span>Ranking da quinzena</span>
                <span>{sortedPeriods.length} quinzena{sortedPeriods.length > 1 ? 's' : ''} salva{sortedPeriods.length > 1 ? 's' : ''}</span>
              </div>
              <Leaderboard
                vendors={vendors}
                maxCommission={maxCommission}
                historyByCode={historyByCode}
                prevByCode={prevByCode}
                carteiraByCode={carteiraByCode}
              />
            </>
          )}

          {!loading && (
            <>
              <div className="flex justify-between items-center text-xs uppercase tracking-wide text-muted mb-3 mt-8 px-0.5">
                <span>Carteira pendente por representante</span>
                <span>o que falta entregar, por fábrica</span>
              </div>
              <CarteiraPendente
                rows={carteiraPorRepresentante}
                dateColch={latestSnapshotByLoja.COLCH?.data_relatorio}
                dateColtim={latestSnapshotByLoja.COLTIM?.data_relatorio}
              />
            </>
          )}

          {modal === 'upload' && (
            <UploadModal
              onClose={() => setModal(null)}
              onDone={async () => {
                await loadAll()
                setModal(null)
              }}
            />
          )}
          {modal === 'exclusions' && (
            <ExclusionsModal exclusions={exclusions} onClose={() => setModal(null)} onChanged={loadAll} />
          )}
          {modal === 'calendario' && <CalendarModal onClose={() => setModal(null)} />}
        </>
      )}
    </div>
  )
}
