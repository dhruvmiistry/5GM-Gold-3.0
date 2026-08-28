'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, RotateCcw, Mail } from 'lucide-react'

type Job = {
  id: string; booking_id: string; type: string; recipient_role: string
  status: string; attempts: number; last_error: string | null
  scheduled_for: string; sent_at: string | null
  recipient: { full_name: string | null; email: string | null } | null
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'text-[#8e8e9a] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',
    processing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    sent: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    failed: 'text-red-400 bg-red-400/10 border-red-400/20',
    skipped: 'text-[#5a5a66] bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)]',
  }
  return <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[status] ?? map.pending}`}>{status}</span>
}

export default function AdminNotificationsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/notifications?status=${statusFilter}`)
      .then(r => r.json())
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const retry = async (id: string) => {
    setRetryingId(id)
    const res = await fetch(`/api/admin/notifications/${id}/retry`, { method: 'POST' })
    setRetryingId(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Retry failed'); return }
    showToast('Queued for retry — next cron sweep picks it up')
    load()
  }

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1.5">Admin</p>
            <h1 className="text-2xl font-light text-white tracking-tight">Notifications</h1>
            <p className="text-[#5a5a66] text-sm mt-1">Booking email queue — cron sweeps every 5 minutes</p>
          </div>
          <div className="flex items-center gap-2">
            {['all', 'pending', 'sent', 'failed', 'skipped'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                style={statusFilter === f
                  ? { background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }
                  : { background: 'rgba(255,255,255,0.04)', color: '#5a5a66', border: '1px solid rgba(255,255,255,0.07)' }}>
                {f}
              </button>
            ))}
            <button onClick={load} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white transition-all"><RefreshCw size={13} /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-[#c9a84c]" /></div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(17,17,19,0.5)' }}>
            <Mail size={20} className="text-[#3a3a46] mx-auto mb-3" />
            <p className="text-[#5a5a66] text-sm">No notifications in this state.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.05)]" style={{ background: 'rgba(17,17,19,0.95)' }}>
              {['Type / Recipient', 'Status', 'Scheduled', 'Attempts', ''].map((h, i) => (
                <div key={h} className={`text-[10px] font-semibold uppercase tracking-widest text-[#3a3a46] ${i === 0 ? 'col-span-5' : i === 4 ? 'col-span-2 text-right' : 'col-span-2'}`}>{h}</div>
              ))}
            </div>
            {jobs.map((j, idx) => (
              <div key={j.id} className="grid grid-cols-12 gap-4 px-5 py-3 items-center"
                style={{ background: idx % 2 === 0 ? 'rgba(17,17,19,0.7)' : 'rgba(12,12,14,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="col-span-5 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{j.type.replace('_', ' ')} · {j.recipient_role}</p>
                  <p className="text-[#5a5a66] text-[10px] mt-0.5 truncate">{j.recipient?.email ?? '—'}</p>
                  {j.last_error && <p className="text-red-400 text-[10px] mt-1 truncate">{j.last_error}</p>}
                </div>
                <div className="col-span-2"><StatusBadge status={j.status} /></div>
                <div className="col-span-2 text-[#5a5a66] text-[11px]">{new Date(j.scheduled_for).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</div>
                <div className="col-span-2 text-[#5a5a66] text-[11px]">{j.attempts}</div>
                <div className="col-span-2 flex justify-end">
                  {j.status === 'failed' && (
                    <button onClick={() => retry(j.id)} disabled={retryingId === j.id}
                      className="flex items-center gap-1 text-[11px] text-[#c9a84c] hover:text-[#e8c96d] transition-colors disabled:opacity-50">
                      {retryingId === j.id ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />} Retry
                    </button>
                  )}
                </div>
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
