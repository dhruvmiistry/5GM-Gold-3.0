'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import MessageThread from '@/components/mentorCalls/MessageThread'
import {
  Loader2, PhoneCall, Plus, X, Calendar, Clock, ChevronRight,
  CheckCircle2, AlertCircle, Link2,
} from 'lucide-react'

type Booking = {
  id: string; status: string; start_at: string; duration_minutes: number
  mentor_id: string | null
  trading_experience: string | null; main_challenge: string | null; discuss_topic: string | null
  cancel_kind: string | null; cancel_reason: string | null
  mentor: { full_name: string | null } | null
  // 1:1 relation — object or null, not an array.
  mentor_booking_meeting_details: { meeting_url: string | null; meeting_id: string | null; passcode: string | null } | null
}

const LONDON_TZ = 'Europe/London' // shown explicitly everywhere until a per-member preference exists

function formatLondon(iso: string) {
  const d = new Date(iso)
  const dateLabel = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: LONDON_TZ }).format(d)
  const timeLabel = new Intl.DateTimeFormat('en-GB', { timeStyle: 'short', timeZone: LONDON_TZ }).format(d)
  return { dateLabel, timeLabel }
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

export default function MentorCallsClient() {
  const [balance, setBalance] = useState<number | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [bookOpen, setBookOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000) }

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/credits/balance').then(r => r.json()),
      fetch('/api/bookings').then(r => r.json()),
    ]).then(([bal, bks]) => {
      setBalance(bal.balance ?? 0)
      setBookings(Array.isArray(bks) ? bks : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const upcoming = bookings.filter(b => b.status === 'confirmed')
  const past = bookings.filter(b => b.status !== 'confirmed')
  const hasUpcoming = upcoming.length > 0
  const canBook = (balance ?? 0) > 0 && !hasUpcoming

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-8 md:py-12 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-2">Mentor Calls</p>
            <h1 className="text-[1.7rem] font-light text-white tracking-tight leading-snug">Your Calls</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-[#c9a84c]" /></div>
        ) : (
          <>
            {/* Credit / booking entry point */}
            <div className="relative rounded-2xl overflow-hidden p-6" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.16)' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 15% 0%, rgba(201,168,76,0.07) 0%, transparent 60%)' }} />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)' }}>
                  <PhoneCall size={20} className="text-black" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-white text-base font-medium mb-1">
                    {balance === 0 ? 'No call credits remaining' : `${balance} call credit${balance === 1 ? '' : 's'} available`}
                  </p>
                  <p className="text-[#8e8e9a] text-sm leading-relaxed">
                    {balance === 0
                      ? 'You can still see your upcoming and past calls below.'
                      : hasUpcoming
                      ? 'You already have an upcoming call — complete or cancel it before booking another.'
                      : 'Book a one-to-one with a 5GM mentor.'}
                  </p>
                </div>
                <button onClick={() => setBookOpen(true)} disabled={!canBook}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Plus size={15} /> Book a Call
                </button>
              </div>
            </div>

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="space-y-3">
                <p className="section-label">Upcoming</p>
                {upcoming.map(b => <BookingCard key={b.id} booking={b} onChanged={load} showToast={showToast} />)}
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div className="space-y-3">
                <p className="section-label">Past</p>
                {past.map(b => <BookingCard key={b.id} booking={b} onChanged={load} showToast={showToast} />)}
              </div>
            )}

            {bookings.length === 0 && (
              <div className="py-16 text-center rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(17,17,19,0.5)' }}>
                <Calendar size={20} className="text-[#3a3a46] mx-auto mb-3" />
                <p className="text-[#5a5a66] text-sm">No calls yet.</p>
              </div>
            )}
          </>
        )}
      </div>

      {bookOpen && <BookingFlow onClose={() => setBookOpen(false)} onBooked={() => { setBookOpen(false); load() }} />}

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium z-50 max-w-sm"
          style={{ background: 'rgba(17,17,19,0.98)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ── Booking card (upcoming or past) ────────────────────────────────────
function BookingCard({ booking, onChanged, showToast }: { booking: Booking; onChanged: () => void; showToast: (msg: string) => void }) {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const { dateLabel, timeLabel } = formatLondon(booking.start_at)

  // Lazy useState initializer, not useMemo — matches the isPending pattern
  // in app/dashboard/page.tsx's VideoCard. A given booking's start_at is
  // stable for the card's lifetime (reschedule creates a new booking id,
  // which remounts this card under a new key), so computing once at mount
  // is correct, and lazy initializers are exempt from the purity rule that
  // otherwise flags Date.now() reachable during render (e.g. in useMemo).
  const [wouldRefund] = useState(() => (new Date(booking.start_at).getTime() - Date.now()) / 3_600_000 >= 12)

  const cancel = async () => {
    if (!confirm(wouldRefund
      ? "Cancel this call? You're outside the 12-hour cutoff, so your credit will be refunded."
      : "Cancel this call? You're inside the 12-hour cutoff, so this credit will NOT be refunded.")) return
    setBusy(true)
    const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setBusy(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Cancel failed'); return }
    showToast('Call cancelled')
    onChanged()
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(17,17,19,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <button onClick={() => setExpanded(x => !x)} className="w-full flex items-center gap-4 p-4 text-left">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)' }}>
          <Clock size={15} className="text-[#c9a84c]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white text-sm font-medium truncate">{dateLabel}</p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-[#5a5a66] text-xs">{timeLabel} London time · {booking.duration_minutes} min · {booking.mentor?.full_name ?? (booking.status === 'confirmed' ? 'Mentor to be confirmed' : '—')}</p>
        </div>
        <ChevronRight size={14} className={`text-[#5a5a66] shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {booking.discuss_topic && <p className="text-[#8e8e9a] text-xs pt-3">&ldquo;{booking.discuss_topic}&rdquo;</p>}

          {booking.status === 'confirmed' && (
            <>
              {booking.mentor_booking_meeting_details?.meeting_url ? (
                <a href={booking.mentor_booking_meeting_details.meeting_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#c9a84c] hover:text-[#e8c96d] transition-colors">
                  <Link2 size={12} /> Join call
                </a>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-[#5a5a66]"><AlertCircle size={12} /> Joining details will follow before the call.</p>
              )}

              <p className="text-[10px] text-[#5a5a66]">
                {wouldRefund ? 'Cancel or reschedule up to 12 hours before to get your credit back.' : "You're inside the 12-hour cutoff — cancelling now won't refund this credit."}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => setRescheduling(true)} disabled={busy}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#8e8e9a] disabled:opacity-50" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Reschedule
                </button>
                <button onClick={cancel} disabled={busy}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-red-400 disabled:opacity-50" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                  {busy ? <Loader2 size={11} className="animate-spin" /> : 'Cancel'}
                </button>
              </div>
            </>
          )}

          {booking.cancel_reason && <p className="text-[#5a5a66] text-[11px]">Cancelled: {booking.cancel_reason}</p>}

          {user && (
            <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="section-label mb-2">Messages</p>
              <MessageThread apiBase={`/api/bookings/${booking.id}/messages`} currentUserId={user.id} />
            </div>
          )}
        </div>
      )}

      {rescheduling && (
        <RescheduleFlow booking={booking} onClose={() => setRescheduling(false)}
          onDone={() => { setRescheduling(false); onChanged() }} showToast={showToast} />
      )}
    </div>
  )
}

// ── Reschedule — same date/time picker as booking, against one existing booking ──
function RescheduleFlow({ booking, onClose, onDone, showToast }: { booking: Booking; onClose: () => void; onDone: () => void; showToast: (msg: string) => void }) {
  return (
    <SlotPicker
      title="Reschedule Call"
      confirmLabel="Confirm New Time"
      onClose={onClose}
      onConfirm={async (startAtIso) => {
        const res = await fetch(`/api/bookings/${booking.id}/reschedule`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startAt: startAtIso }),
        })
        if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Reschedule failed'); return false }
        showToast('Call rescheduled — no extra credit charged')
        onDone()
        return true
      }}
    />
  )
}

// ── Booking flow (new booking) — date → time → context → review → confirm ──
function BookingFlow({ onClose, onBooked }: { onClose: () => void; onBooked: () => void }) {
  const [step, setStep] = useState<'slot' | 'context' | 'review'>('slot')
  const [startAtIso, setStartAtIso] = useState<string | null>(null)
  const [tradingExperience, setTradingExperience] = useState('')
  const [mainChallenge, setMainChallenge] = useState('')
  const [discussTopic, setDiscussTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [idempotencyKey] = useState(() => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`))

  if (step === 'slot') {
    return (
      <SlotPicker
        title="Book a Call"
        confirmLabel="Continue"
        onClose={onClose}
        onConfirm={async (iso) => { setStartAtIso(iso); setStep('context'); return true }}
      />
    )
  }

  const { dateLabel, timeLabel } = startAtIso ? formatLondon(startAtIso) : { dateLabel: '', timeLabel: '' }

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startAt: startAtIso, tradingExperience: tradingExperience || undefined, mainChallenge: mainChallenge || undefined, discussTopic: discussTopic || undefined, idempotencyKey }),
    })
    setSubmitting(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Booking failed'); return }
    onBooked()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 ml-auto w-full max-w-md h-full overflow-y-auto flex flex-col" style={{ background: 'rgba(10,10,11,0.98)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] sticky top-0" style={{ background: 'rgba(10,10,11,0.98)' }}>
          <h2 className="text-white font-medium">{step === 'context' ? 'A Little Context' : 'Review & Confirm'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"><X size={15} /></button>
        </div>

        {step === 'context' && (
          <div className="flex-1 px-6 py-5 space-y-4">
            <p className="text-[#5a5a66] text-xs">Optional — helps your mentor prepare. Skip anything you&rsquo;d rather not share.</p>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Trading experience</label>
              <input value={tradingExperience} onChange={e => setTradingExperience(e.target.value)} placeholder="e.g. Beginner, 6 months" className="input-dark w-full text-sm" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Main challenge</label>
              <input value={mainChallenge} onChange={e => setMainChallenge(e.target.value)} placeholder="e.g. Risk management" className="input-dark w-full text-sm" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">What would you like to discuss?</label>
              <textarea value={discussTopic} onChange={e => setDiscussTopic(e.target.value)} rows={3} placeholder="Anything specific on your mind…" className="input-dark w-full text-sm resize-none" />
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="flex-1 px-6 py-5 space-y-4">
            <div className="p-5 rounded-2xl space-y-3" style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {[['Mentor', 'To be confirmed by 5GM'], ['Date', dateLabel], ['Time', `${timeLabel} London time`], ['Duration', '30 minutes'], ['Credit cost', '1 call credit']].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-[#5a5a66] text-xs uppercase tracking-wide">{label}</span>
                  <span className="text-white">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-[#8e8e9a] text-xs leading-relaxed">
              A 5GM mentor will be assigned and you&rsquo;ll get a confirmation email once that happens.
              You can cancel or reschedule up to 12 hours before your call to get your credit back — inside that window, the credit is used.
            </p>
            {error && <p className="text-red-400 text-xs flex items-center gap-1.5"><AlertCircle size={12} /> {error}</p>}
          </div>
        )}

        <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0 flex gap-2" style={{ background: 'rgba(10,10,11,0.98)' }}>
          <button onClick={() => setStep(step === 'review' ? 'context' : 'slot')}
            className="px-4 py-3 rounded-xl text-sm font-medium text-[#8e8e9a]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Back
          </button>
          {step === 'context' ? (
            <button onClick={() => setStep('review')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
              Review Booking
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Confirm Booking
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared date/time slot picker (used by both new-booking and reschedule) ──
function SlotPicker({ title, confirmLabel, onClose, onConfirm }: {
  title: string; confirmLabel: string; onClose: () => void; onConfirm: (startAtIso: string) => Promise<boolean>
}) {
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [minDate] = useState(() => new Date(Date.now() + 24 * 3_600_000).toISOString().slice(0, 10))
  const [maxDate] = useState(() => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10))

  useEffect(() => {
    if (!date) { setSlots([]); return }
    setLoadingSlots(true)
    setSelected(null)
    fetch(`/api/bookings/available-slots?date=${date}`)
      .then(r => r.json())
      .then(data => { setSlots(Array.isArray(data) ? data : []); setLoadingSlots(false) })
      .catch(() => setLoadingSlots(false))
  }, [date])

  const confirm = async () => {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    const ok = await onConfirm(selected)
    setSubmitting(false)
    if (!ok) setError('That slot may no longer be available — try a different time.')
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 ml-auto w-full max-w-md h-full overflow-y-auto flex flex-col" style={{ background: 'rgba(10,10,11,0.98)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] sticky top-0" style={{ background: 'rgba(10,10,11,0.98)' }}>
          <h2 className="text-white font-medium">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"><X size={15} /></button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Date</label>
            <input type="date" min={minDate} max={maxDate} value={date} onChange={e => setDate(e.target.value)} className="input-dark w-full text-sm" />
            <p className="text-[10px] text-[#5a5a66] mt-1.5">Times shown in London time. At least 24 hours&rsquo; notice required.</p>
          </div>

          {date && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-2">Time</label>
              {loadingSlots ? (
                <div className="flex justify-center py-8"><Loader2 size={16} className="animate-spin text-[#c9a84c]" /></div>
              ) : slots.length === 0 ? (
                <p className="text-[#5a5a66] text-xs py-4">No availability that day — try another date.</p>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 gap-2">
                  {slots.map(iso => {
                    const label = new Intl.DateTimeFormat('en-GB', { timeStyle: 'short', timeZone: LONDON_TZ }).format(new Date(iso))
                    const isSelected = selected === iso
                    return (
                      <button key={iso} onClick={() => setSelected(iso)}
                        className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={isSelected
                          ? { background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', color: '#e8c96d' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8e8e9a' }}>
                        {label}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </div>
          )}
          {error && <p className="text-red-400 text-xs flex items-center gap-1.5"><AlertCircle size={12} /> {error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0" style={{ background: 'rgba(10,10,11,0.98)' }}>
          <button onClick={confirm} disabled={!selected || submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
