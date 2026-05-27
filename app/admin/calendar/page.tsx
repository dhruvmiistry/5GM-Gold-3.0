'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Play, Radio, Bell, Loader2 } from 'lucide-react'

type CalItem = {
  id: string; title: string; date: Date
  type: 'video' | 'session' | 'announcement'
  status: string; access_level?: string
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const typeConfig = {
  video: { icon: Play, color: '#c9a84c', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.2)' },
  session: { icon: Radio, color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
  announcement: { icon: Bell, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
}

export default function AdminCalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [items, setItems] = useState<CalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const [vidRes, sesRes, annRes] = await Promise.all([
        fetch('/api/admin/videos'),
        fetch('/api/admin/live-sessions'),
        fetch('/api/admin/announcements'),
      ])
      const [videos, sessions, announcements] = await Promise.all([
        vidRes.json(), sesRes.json(), annRes.json(),
      ])

      const allItems: CalItem[] = []

      if (Array.isArray(videos)) {
        for (const v of videos) {
          const d = v.release_date ? new Date(v.release_date) : new Date(v.created_at)
          allItems.push({ id: v.id, title: v.title, date: d, type: 'video', status: v.status, access_level: v.access_level })
        }
      }
      if (Array.isArray(sessions)) {
        for (const s of sessions) {
          allItems.push({ id: s.id, title: s.title, date: new Date(s.session_time), type: 'session', status: s.status, access_level: s.access_level })
        }
      }
      if (Array.isArray(announcements)) {
        for (const a of announcements) {
          const d = a.scheduled_for ? new Date(a.scheduled_for) : new Date(a.created_at)
          allItems.push({ id: a.id, title: a.title, date: d, type: 'announcement', status: a.status })
        }
      }

      setItems(allItems)
      setLoading(false)
    }
    fetchAll()
  }, [])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1); setSelectedDay(null) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1); setSelectedDay(null) }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1)
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const itemsForDay = (day: number) =>
    items.filter(it => it.date.getFullYear() === year && it.date.getMonth() === month && it.date.getDate() === day)

  const selectedItems = selectedDay ? itemsForDay(selectedDay) : []

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1.5">Admin</p>
            <h1 className="text-2xl font-light text-white tracking-tight">Calendar</h1>
            <p className="text-[#5a5a66] text-sm mt-1">Videos, sessions, and announcements</p>
          </div>
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4">
            {Object.entries(typeConfig).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <cfg.icon size={9} style={{ color: cfg.color }} />
                </div>
                <span className="text-[#5a5a66] text-xs capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(17,17,19,0.85)' }}>
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <button onClick={prevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <ChevronLeft size={15} />
              </button>
              <h2 className="text-white font-medium">{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-[rgba(255,255,255,0.05)]">
              {DAYS.map(d => (
                <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-[#3a3a46]">{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                const dayItems = day ? itemsForDay(day) : []
                const isSelected = day === selectedDay
                return (
                  <div key={i}
                    onClick={() => day && setSelectedDay(isSelected ? null : day)}
                    className={`min-h-[80px] p-2 border-r border-b border-[rgba(255,255,255,0.04)] transition-all ${day ? 'cursor-pointer' : ''} ${isSelected ? 'bg-[rgba(201,168,76,0.06)]' : day ? 'hover:bg-[rgba(255,255,255,0.02)]' : ''}`}
                    style={i % 7 === 6 ? { borderRight: 'none' } : {}}>
                    {day && (
                      <>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1.5 ${isToday ? 'bg-[#c9a84c] text-black font-bold' : 'text-[#5a5a66]'}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayItems.slice(0, 3).map(item => {
                            const cfg = typeConfig[item.type]
                            return (
                              <div key={item.id}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] truncate"
                                style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                                <cfg.icon size={7} />
                                <span className="truncate">{item.title}</span>
                              </div>
                            )
                          })}
                          {dayItems.length > 3 && (
                            <div className="text-[9px] text-[#5a5a66] pl-1">+{dayItems.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Day detail */}
        {selectedDay && (
          <div className="p-5 rounded-2xl" style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-white font-medium mb-4 text-sm">
              {MONTHS[month]} {selectedDay}, {year} — {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
            </h3>
            {selectedItems.length === 0 ? (
              <p className="text-[#5a5a66] text-sm">Nothing scheduled on this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedItems.map(item => {
                  const cfg = typeConfig[item.type]
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <cfg.icon size={12} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: cfg.color }}>{item.title}</p>
                        <p className="text-[10px] capitalize" style={{ color: cfg.color, opacity: 0.6 }}>
                          {item.type} · {item.status.replace('_', ' ')} · {item.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
