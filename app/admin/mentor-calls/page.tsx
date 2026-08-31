'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import MessageThread from '@/components/mentorCalls/MessageThread'
import StaffNotes from '@/components/mentorCalls/StaffNotes'
import { Loader2, Search, RefreshCw, Link2, Check, ChevronDown, Power, AlertTriangle } from 'lucide-react'

type Booking = {
  id: string; status: string; start_at: string; duration_minutes: number
  mentor_id: string | null; cancel_kind: string | null; cancel_reason: string | null
  trading_experience: string | null; main_challenge: string | null; discuss_topic: string | null
  member: { full_name: string | null; email: string | null } | null
  mentor: { full_name: string | null; email: string | null } | null
  // 1:1 relation (booking_id is the child table's own primary key) — Supabase
  // embeds this as a single object or null, NOT an array, unlike the
  // one-to-many member/mentor relations above.
  mentor_booking_meeting_details: { meeting_url: string | null; meeting_id: string | null; passcode: string | null } | null
}
type MentorOption = { profile_id: string; display_name: string; active: boolean }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    cancelled: 'text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',
    completed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    no_show: 'text-red-400 bg-red-400/10 border-red-400/20',
  }
  return <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[status] ?? map.confirmed}`}>{status.replace('_', ' ')}</span>
}

type FlagHistoryRow = {
  actor_id: string
  created_at: string
  metadata: { previous_value?: boolean; new_value?: boolean }
  actor: { full_name: string | null; email: string | null } | null
}

// Developer-only release-control toggle for mentor_calls_enabled. OFF by
// default and never flipped automatically — this is the one place the
// flag gets turned on for every member, and every change is written to
// staff_audit_log with who and when, surfaced right here as recent
// history. The API behind this (verifyDeveloper()) is locked to a single
// account, not the general 'admin' role — the other admin accounts get a
// 403, so this card hides itself entirely for them rather than showing a
// toggle that would just fail when clicked.
function ReleaseControlCard({ showToast }: { showToast: (msg: string) => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [history, setHistory] = useState<FlagHistoryRow[]>([])
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [visible, setVisible] = useState(false)

  const load = useCallback(() => {
    fetch('/api/admin/mentor-calls/flag')
      .then(r => {
        if (!r.ok) { setVisible(false); return null }
        setVisible(true)
        return r.json()
      })
      .then(d => { if (d) { setEnabled(!!d.enabled); setHistory(Array.isArray(d.history) ? d.history : []) } })
      .catch(() => setVisible(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (!visible) return null

  const toggle = async () => {
    const next = !enabled
    setBusy(true)
    setConfirming(false)
    const res = await fetch('/api/admin/mentor-calls/flag', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: next }),
    })
    setBusy(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Failed to update'); return }
    showToast(next ? 'Mentor calls enabled for members' : 'Mentor calls disabled for members')
    load()
  }

  return (
    <div className="p-5 rounded-2xl space-y-4" style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: enabled ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${enabled ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
            <Power size={15} className={enabled ? 'text-emerald-400' : 'text-[#5a5a66]'} />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Enable mentor calls</p>
            <p className="text-[#8e8e9a] text-xs mt-0.5 max-w-md">
              Make mentor booking, call credits, booking conversations, and eligible post-video invitations available to members.
            </p>
            <p className="text-[10px] mt-1.5 font-semibold uppercase tracking-widest" style={{ color: enabled ? '#34d399' : '#5a5a66' }}>
              Currently {enabled === null ? '…' : enabled ? 'ON — visible to members' : 'OFF — hidden from members'}
            </p>
          </div>
        </div>

        {!confirming ? (
          <button onClick={() => setConfirming(true)} disabled={busy || enabled === null}
            className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 shrink-0"
            style={enabled
              ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', color: '#f87171' }
              : { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>
            {enabled ? 'Disable' : 'Enable'}
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setConfirming(false)} className="px-3 py-2.5 rounded-xl text-xs font-medium text-[#8e8e9a]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Cancel
            </button>
            <button onClick={toggle} disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium disabled:opacity-50"
              style={enabled
                ? { background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }
                : { background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}>
              {busy ? <Loader2 size={12} className="animate-spin" /> : <AlertTriangle size={12} />}
              Confirm {enabled ? 'disable' : 'enable'}
            </button>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="pt-3 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="section-label">Recent changes</p>
          {history.map((h, i) => (
            <p key={i} className="text-[11px] text-[#5a5a66]">
              {h.actor?.full_name || h.actor?.email || h.actor_id} turned it{' '}
              <span className={h.metadata.new_value ? 'text-emerald-400' : 'text-red-400'}>{h.metadata.new_value ? 'ON' : 'OFF'}</span>
              {' · '}{new Date(h.created_at).toLocaleString('en-GB')}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminMentorCallsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [mentors, setMentors] = useState<MentorOption[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [creditUserId, setCreditUserId] = useState('')
  const [creditDelta, setCreditDelta] = useState(1)
  const [creditReason, setCreditReason] = useState('')
  const [backfillBusy, setBackfillBusy] = useState<'free' | 'gold' | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000) }

  const load = useCallback(() => {
    setLoading(true)
    const qs = statusFilter === 'needs_mentor' ? 'needsMentor=1' : statusFilter !== 'all' ? `status=${statusFilter}` : ''
    fetch(`/api/admin/mentor-bookings?${qs}`)
      .then(r => r.json())
      .then(data => { setBookings(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/admin/mentors').then(r => r.json()).then(data => setMentors(Array.isArray(data) ? data.filter((m: MentorOption) => m.active) : [])).catch(() => {})
  }, [])

  // confirmMessage is required for complete/no_show/cancel — a misclick on
  // any of these is hard to walk back (no "undo" RPC exists on purpose,
  // to keep these terminal-state transitions deliberate).
  const runAction = async (id: string, body: Record<string, unknown>, confirmMessage?: string) => {
    if (confirmMessage && !confirm(confirmMessage)) return
    setBusyId(id)
    const res = await fetch(`/api/admin/mentor-bookings/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    setBusyId(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Action failed'); return }
    showToast('Done')
    load()
  }

  const adjustCredits = async () => {
    if (!creditUserId.trim() || !creditReason.trim()) { showToast('User id and reason are required'); return }
    const res = await fetch('/api/admin/credits/adjust', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: creditUserId.trim(), delta: creditDelta, reason: creditReason.trim() }),
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Adjustment failed'); return }
    showToast('Credits adjusted')
    setCreditReason('')
  }

  const runBackfill = async (type: 'free' | 'gold') => {
    setBackfillBusy(type)
    const res = await fetch('/api/admin/credits/backfill', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }),
    })
    setBackfillBusy(null)
    const d = await res.json().catch(() => ({}))
    if (!res.ok) { showToast(d.error || 'Backfill failed'); return }
    showToast(`Backfilled ${d.granted}/${d.processed} ${type} members${d.errors?.length ? ` (${d.errors.length} errors)` : ''}`)
  }

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 space-y-8">
        <div>
          <p className="section-label mb-1.5">Admin</p>
          <h1 className="text-2xl font-light text-white tracking-tight">Mentor Calls</h1>
        </div>

        <ReleaseControlCard showToast={showToast} />

        {/* Credits panel */}
        <div className="p-5 rounded-2xl space-y-4" style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="section-label">Credits</p>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-[#3a3a42] mb-1">User ID</label>
              <input value={creditUserId} onChange={e => setCreditUserId(e.target.value)} placeholder="profile uuid" className="input-dark text-sm w-64" />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-[#3a3a42] mb-1">Delta</label>
              <input type="number" value={creditDelta} onChange={e => setCreditDelta(Number(e.target.value))} className="input-dark text-sm w-24" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[9px] uppercase tracking-widest text-[#3a3a42] mb-1">Reason (required)</label>
              <input value={creditReason} onChange={e => setCreditReason(e.target.value)} placeholder="Why?" className="input-dark text-sm w-full" />
            </div>
            <button onClick={adjustCredits}
              className="px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
              Adjust
            </button>
          </div>
          <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[#5a5a66] text-xs">Bulk backfill (idempotent — safe to re-run):</span>
            <button onClick={() => runBackfill('free')} disabled={backfillBusy !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8e8e9a' }}>
              {backfillBusy === 'free' && <Loader2 size={11} className="animate-spin" />} Backfill Free members
            </button>
            <button onClick={() => runBackfill('gold')} disabled={backfillBusy !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8e8e9a' }}>
              {backfillBusy === 'gold' && <Loader2 size={11} className="animate-spin" />} Backfill Gold members
            </button>
          </div>
        </div>

        {/* Bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">Bookings</p>
            <div className="flex items-center gap-2">
              {['all', 'needs_mentor', 'confirmed', 'cancelled', 'completed', 'no_show'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                  style={statusFilter === f
                    ? { background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#5a5a66', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {f.replace('_', ' ')}
                </button>
              ))}
              <button onClick={load} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white transition-all"><RefreshCw size={13} /></button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-[#c9a84c]" /></div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(17,17,19,0.5)' }}>
              <Search size={20} className="text-[#3a3a46] mx-auto mb-3" />
              <p className="text-[#5a5a66] text-sm">No bookings match this filter.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map(b => (
                <div key={b.id} className="p-4 rounded-2xl" style={{ background: 'rgba(17,17,19,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white text-sm font-medium">{b.member?.full_name ?? b.member?.email ?? 'Member'}</p>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-[#5a5a66] text-xs">
                        {new Date(b.start_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} · {b.duration_minutes} min
                        {' · '}Mentor: {b.mentor?.full_name ?? (b.status === 'confirmed' ? 'Needs assignment' : '—')}
                      </p>
                      {(b.discuss_topic || b.main_challenge) && (
                        <p className="text-[#8e8e9a] text-xs mt-1.5">{b.discuss_topic || b.main_challenge}</p>
                      )}
                      {b.cancel_reason && <p className="text-[#5a5a66] text-[11px] mt-1">Cancelled ({b.cancel_kind}): {b.cancel_reason}</p>}
                    </div>

                    {b.status === 'confirmed' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!b.mentor_id && (
                          <select
                            disabled={busyId === b.id}
                            onChange={e => { if (e.target.value) runAction(b.id, { action: 'assign', mentorId: e.target.value }) }}
                            className="input-dark text-xs w-auto" defaultValue="">
                            <option value="" disabled>Assign mentor…</option>
                            {mentors.map(m => <option key={m.profile_id} value={m.profile_id}>{m.display_name}</option>)}
                          </select>
                        )}
                        <button disabled={busyId === b.id}
                          onClick={() => runAction(b.id, { action: 'complete' }, 'Mark this call as completed? This cannot be undone from the UI.')}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-blue-400" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                          Complete
                        </button>
                        <button disabled={busyId === b.id}
                          onClick={() => runAction(b.id, { action: 'no_show' }, 'Mark this as a no-show? The credit will NOT be refunded. This cannot be undone from the UI.')}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          No-show
                        </button>
                        <button disabled={busyId === b.id}
                          onClick={() => runAction(b.id, { action: 'cancel', reason: 'Cancelled by admin' }, 'Cancel this booking? The credit will be refunded to the member.')}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#8e8e9a]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  {b.status === 'confirmed' && <MeetingLinkRow booking={b} onSaved={load} showToast={showToast} />}

                  <button onClick={() => setExpandedId(x => x === b.id ? null : b.id)}
                    className="mt-2 flex items-center gap-1 text-[11px] text-[#5a5a66] hover:text-[#c9a84c] transition-colors">
                    <ChevronDown size={11} className={`transition-transform ${expandedId === b.id ? 'rotate-180' : ''}`} /> Messages &amp; staff notes
                  </button>

                  {expandedId === b.id && user && (
                    <div className="mt-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="section-label mb-2">Messages</p>
                      <MessageThread apiBase={`/api/admin/mentor-bookings/${b.id}/messages`} currentUserId={user.id} />
                      <StaffNotes apiBase={`/api/admin/mentor-bookings/${b.id}/notes`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium z-50 max-w-sm"
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
    const res = await fetch(`/api/admin/mentor-bookings/${booking.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'meeting_details', meetingUrl: url || null, meetingId: meetingId || null, passcode: passcode || null }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Failed to save'); return }
    showToast('Meeting details saved')
    setEditing(false)
    onSaved()
  }

  // Re-sync the form from the latest fetched data at the moment editing
  // opens, rather than relying on useState's mount-only initializer — the
  // component instance persists across saves (same key, no remount), so a
  // stale initial value would otherwise silently linger and could be
  // resubmitted, overwriting a real value with nothing.
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
