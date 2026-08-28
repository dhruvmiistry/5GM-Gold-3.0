'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react'

type Weekly = { id: string; day_of_week: number; start_time: string; end_time: string }
type Override = { id: string; date: string; kind: 'unavailable' | 'custom_hours'; start_time: string | null; end_time: string | null; note: string | null }
type MentorInfo = { display_name: string; profiles: { full_name: string | null; email: string | null } | null }

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Admin equivalent of app/mentor/availability/page.tsx — same shape,
// scoped by :id in the URL instead of the caller's own identity.
export default function AdminMentorAvailabilityPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [mentor, setMentor] = useState<MentorInfo | null>(null)
  const [weekly, setWeekly] = useState<Weekly[]>([])
  const [overrides, setOverrides] = useState<Override[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const [newDay, setNewDay] = useState(1)
  const [newStart, setNewStart] = useState('09:00')
  const [newEnd, setNewEnd] = useState('17:00')

  const [overrideDate, setOverrideDate] = useState('')
  const [overrideKind, setOverrideKind] = useState<'unavailable' | 'custom_hours'>('unavailable')
  const [overrideStart, setOverrideStart] = useState('09:00')
  const [overrideEnd, setOverrideEnd] = useState('17:00')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/mentors/${id}/availability`).then(r => r.json()),
      fetch('/api/admin/mentors').then(r => r.json()),
    ]).then(([avail, mentors]) => {
      setWeekly(avail.weekly ?? [])
      setOverrides(avail.overrides ?? [])
      setMentor(Array.isArray(mentors) ? mentors.find((m: { profile_id: string }) => m.profile_id === id) ?? null : null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const addWeekly = async () => {
    const res = await fetch(`/api/admin/mentors/${id}/availability`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'weekly', dayOfWeek: newDay, startTime: newStart, endTime: newEnd }),
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Failed to add'); return }
    load()
  }

  const addOverride = async () => {
    if (!overrideDate) { showToast('Pick a date'); return }
    const res = await fetch(`/api/admin/mentors/${id}/availability`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'override', date: overrideDate, kind: overrideKind,
        startTime: overrideKind === 'custom_hours' ? overrideStart : undefined,
        endTime: overrideKind === 'custom_hours' ? overrideEnd : undefined,
      }),
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Failed to add'); return }
    setOverrideDate('')
    load()
  }

  const remove = async (type: 'weekly' | 'override', rowId: string) => {
    const res = await fetch(`/api/admin/mentors/${id}/availability?type=${type}&rowId=${rowId}`, { method: 'DELETE' })
    if (!res.ok) { showToast('Failed to remove'); return }
    load()
  }

  if (loading) {
    return <div className="dashboard-bg min-h-full flex items-center justify-center py-24"><Loader2 size={20} className="animate-spin text-[#c9a84c]" /></div>
  }

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-8 space-y-8">
        <div>
          <button onClick={() => router.push('/admin/mentors')}
            className="flex items-center gap-1.5 text-xs text-[#5a5a66] hover:text-white transition-colors mb-3">
            <ArrowLeft size={12} /> Back to Mentors
          </button>
          <p className="section-label mb-1.5">Admin</p>
          <h1 className="text-2xl font-light text-white tracking-tight">
            {mentor?.display_name ?? 'Mentor'} — Availability
          </h1>
          <p className="text-[#5a5a66] text-sm mt-1">{mentor?.profiles?.email}</p>
        </div>

        {/* Weekly template */}
        <div className="space-y-3">
          <p className="section-label">Weekly Hours</p>
          {DAYS.map((day, i) => {
            const windows = weekly.filter(w => w.day_of_week === i)
            return (
              <div key={i} className="flex items-start gap-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-[#8e8e9a] text-sm w-24 shrink-0 pt-1.5">{day}</span>
                <div className="flex-1 flex flex-wrap gap-2">
                  {windows.length === 0 && <span className="text-[#3a3a46] text-xs pt-1.5">Unavailable</span>}
                  {windows.map(w => (
                    <span key={w.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', color: '#c9a84c' }}>
                      {w.start_time.slice(0, 5)}–{w.end_time.slice(0, 5)}
                      <button onClick={() => remove('weekly', w.id)} className="hover:text-red-400 transition-colors"><Trash2 size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <select value={newDay} onChange={e => setNewDay(Number(e.target.value))} className="input-dark text-sm w-auto">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="input-dark text-sm w-auto" />
            <span className="text-[#5a5a66] text-xs">to</span>
            <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="input-dark text-sm w-auto" />
            <button onClick={addWeekly}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
              <Plus size={12} /> Add
            </button>
          </div>
        </div>

        {/* Overrides */}
        <div className="space-y-3">
          <p className="section-label">Time Off / Custom Hours</p>
          {overrides.length === 0 && <p className="text-[#3a3a46] text-xs">No upcoming overrides.</p>}
          {overrides.map(o => (
            <div key={o.id} className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-white text-sm">{o.date}</p>
                <p className="text-[#5a5a66] text-xs">
                  {o.kind === 'unavailable' ? 'Unavailable' : `${o.start_time?.slice(0, 5)}–${o.end_time?.slice(0, 5)}`}
                </p>
              </div>
              <button onClick={() => remove('override', o.id)} className="text-[#5a5a66] hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <input type="date" value={overrideDate} onChange={e => setOverrideDate(e.target.value)} className="input-dark text-sm w-auto" />
            <select value={overrideKind} onChange={e => setOverrideKind(e.target.value as 'unavailable' | 'custom_hours')} className="input-dark text-sm w-auto">
              <option value="unavailable">Unavailable</option>
              <option value="custom_hours">Custom hours</option>
            </select>
            {overrideKind === 'custom_hours' && (
              <>
                <input type="time" value={overrideStart} onChange={e => setOverrideStart(e.target.value)} className="input-dark text-sm w-auto" />
                <span className="text-[#5a5a66] text-xs">to</span>
                <input type="time" value={overrideEnd} onChange={e => setOverrideEnd(e.target.value)} className="input-dark text-sm w-auto" />
              </>
            )}
            <button onClick={addOverride}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium z-50"
          style={{ background: 'rgba(17,17,19,0.98)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
