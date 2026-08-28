'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import MessageThread from '@/components/mentorCalls/MessageThread'
import StaffNotes from '@/components/mentorCalls/StaffNotes'
import { Loader2, Clock, Settings, Link2, Check } from 'lucide-react'

type Booking = {
  id: string; status: string; start_at: string; duration_minutes: number
  main_challenge: string | null; discuss_topic: string | null
  trading_experience: string | null
  member: { full_name: string | null; email: string | null } | null
  // 1:1 relation — Supabase embeds this as a single object or null, not an
  // array (unlike a one-to-many relation).
  mentor_booking_meeting_details: { meeting_url: string | null; meeting_id: string | null; passcode: string | null } | null
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    cancelled: 'text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',
    completed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    no_show: 'text-red-400 bg-red-400/10 border-red-400/20',
  }
  return <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[status] ?? map.confirmed}`}>{status.replace('_', ' ')}</span>
}

export default function MentorHomePage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(() => {
    fetch('/api/mentor/bookings')
      .then(r => r.json())
      .then(data => { setBookings(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const markOutcome = async (id: string, outcome: 'complete' | 'no_show') => {
    if (!confirm(outcome === 'complete' ? 'Mark this call as completed?' : 'Mark this as a no-show? The credit will not be refunded.')) return
    setBusyId(id)
    const res = await fetch(`/api/mentor/bookings/${id}/outcome`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outcome }) })
    setBusyId(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Failed'); return }
    showToast('Updated')
    load()
  }

  const upcoming = bookings.filter(b => b.status === 'confirmed')

  return (
    <div className="dashboard-bg min-h-[calc(100vh-3rem)]">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1.5">Mentor Portal</p>
            <h1 className="text-2xl font-light text-white tracking-tight">Your Calls</h1>
          </div>
          <Link href="/mentor/availability"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8e8e9a' }}>
            <Settings size={14} /> Manage Availability
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-[#c9a84c]" /></div>
        ) : upcoming.length === 0 ? (
          <div className="py-16 text-center rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(17,17,19,0.5)' }}>
            <Clock size={22} className="text-[#3a3a46] mx-auto mb-3" />
            <p className="text-[#5a5a66] text-sm">No upcoming calls assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map(b => (
              <div key={b.id} className="p-4 rounded-2xl" style={{ background: 'rgba(17,17,19,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white text-sm font-medium">{b.member?.full_name ?? b.member?.email ?? 'Member'}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-[#5a5a66] text-xs">
                  {new Date(b.start_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} · {b.duration_minutes} min
                </p>
                {b.trading_experience && <p className="text-[#5a5a66] text-[11px] mt-2">Experience: {b.trading_experience}</p>}
                {b.main_challenge && <p className="text-[#5a5a66] text-[11px]">Challenge: {b.main_challenge}</p>}
                {b.discuss_topic && <p className="text-[#8e8e9a] text-xs mt-2">&ldquo;{b.discuss_topic}&rdquo;</p>}
                <MeetingLinkRow booking={b} onSaved={load} showToast={showToast} />

                <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button disabled={busyId === b.id} onClick={() => markOutcome(b.id, 'complete')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-blue-400 disabled:opacity-50" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    Mark Completed
                  </button>
                  <button disabled={busyId === b.id} onClick={() => markOutcome(b.id, 'no_show')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-400 disabled:opacity-50" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    No-show
                  </button>
                </div>

                {user && (
                  <div className="pt-3 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="section-label mb-2">Messages</p>
                    <MessageThread apiBase={`/api/mentor/bookings/${b.id}/messages`} currentUserId={user.id} />
                    <StaffNotes apiBase={`/api/mentor/bookings/${b.id}/notes`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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

function MeetingLinkRow({ booking, onSaved, showToast }: { booking: Booking; onSaved: () => void; showToast: (msg: string) => void }) {
  const existing = booking.mentor_booking_meeting_details
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState(existing?.meeting_url ?? '')
  const [meetingId, setMeetingId] = useState(existing?.meeting_id ?? '')
  const [passcode, setPasscode] = useState(existing?.passcode ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/mentor/bookings/${booking.id}/meeting-details`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingUrl: url || null, meetingId: meetingId || null, passcode: passcode || null }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Failed to save'); return }
    showToast('Meeting details saved')
    setEditing(false)
    onSaved()
  }

  // Re-sync from the latest fetched data at the moment editing opens —
  // this component instance persists across saves (same key, no
  // remount), so relying only on useState's mount-time initializer could
  // leave a stale value in the form after an external change.
  const openEditor = () => {
    setUrl(existing?.meeting_url ?? '')
    setMeetingId(existing?.meeting_id ?? '')
    setPasscode(existing?.passcode ?? '')
    setEditing(true)
  }

  if (!editing) {
    return (
      <button onClick={openEditor}
        className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#5a5a66] hover:text-[#c9a84c] transition-colors">
        {existing?.meeting_url ? <Check size={11} className="text-emerald-400" /> : <Link2 size={11} />}
        {existing?.meeting_url ? 'Meeting link set — edit' : 'Add meeting link'}
      </button>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://zoom.us/j/…" className="input-dark text-xs flex-1 min-w-[180px]" />
      <input value={meetingId} onChange={e => setMeetingId(e.target.value)} placeholder="Meeting ID (optional)" className="input-dark text-xs w-36" />
      <input value={passcode} onChange={e => setPasscode(e.target.value)} placeholder="Passcode (optional)" className="input-dark text-xs w-32" />
      <button onClick={save} disabled={saving}
        className="px-3 py-1.5 rounded-lg text-[11px] font-medium disabled:opacity-50"
        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
        {saving ? <Loader2 size={11} className="animate-spin" /> : 'Save'}
      </button>
      <button onClick={() => setEditing(false)} className="text-[11px] text-[#5a5a66] hover:text-white transition-colors">Cancel</button>
    </div>
  )
}
