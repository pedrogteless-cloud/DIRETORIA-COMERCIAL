import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function toISO(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function CalendarModal({ onClose }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [datas, setDatas] = useState([]) // rows from datas_pagamento

  async function load() {
    const { data } = await supabase.from('datas_pagamento').select('*')
    setDatas(data || [])
  }
  useEffect(() => { load() }, [])

  async function toggleDate(iso) {
    const existing = datas.find((d) => d.data === iso)
    if (existing) {
      if (existing.quinzena_id) return // já cumprida, não mexe
      await supabase.from('datas_pagamento').delete().eq('id', existing.id)
    } else {
      await supabase.from('datas_pagamento').insert({ data: iso })
    }
    load()
  }

  const firstDay = new Date(viewYear, viewMonth, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-md">
        <h3 className="font-display text-xl mb-1.5">Datas de pagamento</h3>
        <p className="text-muted text-sm mb-4 leading-relaxed">
          Marque o dia em que cada quinzena é paga. No dia marcado, o bot te cobra o envio dos relatórios daquele
          período pelo Telegram.
        </p>

        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => (viewMonth === 0 ? (setViewMonth(11), setViewYear(viewYear - 1)) : setViewMonth(viewMonth - 1))}
            className="text-muted hover:text-white px-2"
          >
            ‹
          </button>
          <span className="font-display text-sm">{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button
            onClick={() => (viewMonth === 11 ? (setViewMonth(0), setViewYear(viewYear + 1)) : setViewMonth(viewMonth + 1))}
            className="text-muted hover:text-white px-2"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-1">
          {WEEKDAYS.map((w, i) => <div key={i}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />
            const iso = toISO(viewYear, viewMonth, d)
            const marked = datas.find((x) => x.data === iso)
            const isToday = iso === todayISO
            return (
              <button
                key={i}
                onClick={() => toggleDate(iso)}
                className={`aspect-square rounded-lg text-xs flex items-center justify-center border
                  ${marked && marked.quinzena_id ? 'bg-teal/20 border-teal text-teal' : ''}
                  ${marked && !marked.quinzena_id ? 'bg-accent/20 border-accent text-accent' : ''}
                  ${!marked ? 'border-border text-muted hover:bg-white/5' : ''}
                  ${isToday ? 'ring-1 ring-white/40' : ''}
                `}
              >
                {d}
              </button>
            )
          })}
        </div>

        <div className="flex gap-4 mt-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent/60 inline-block" /> agendada</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal/60 inline-block" /> recebida</span>
        </div>

        <div className="flex justify-end mt-5">
          <button onClick={onClose} className="border border-border text-muted rounded-lg px-4 py-2 text-sm hover:bg-white/5">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
