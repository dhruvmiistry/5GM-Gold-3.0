'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Loader2, X, Radio, Clock, ExternalLink } from 'lucide-react'

type LiveSession = {
  id: string; title: string; description: string | null; host_name: string | null
  session_time: string; livestream_url: string | null; replay_url: string | null
  access_level: string; status: string; created_at: string
}

const emptyForm = {
  title: '', description: '', host_name: '', session_time: '',
  livestream_url: '', replay_url: '', access_level: 'gold', status: 'upcoming',
}

const statusStyles: Record<string, { text: string; bg: string; border: string }> = {
  upcoming: { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  live: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  replay_available: { text: 'text-[#c9a84c]', bg: 'bg-[rgba(201,168,76,0.08)]', border: 'border-[rgba(201,168,76,0.2)]' },
  cancelled: { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
}

function SessionStatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] ?? statusStyles.upcoming
  return (
    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${s.text} ${s.bg} ${s.border}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function AdminLiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<LiveSession | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    const res = await fetch(`/api/admin/live-sessions?${params}`)
    const data = await res.json()
    setSessions(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setPanelOpen(true)
  }

  const openEdit = (s: LiveSession) => {
    setEditing(s)
    setForm({
      title: s.title, description: s.description ?? '',
      host_name: s.host_name ?? '', session_time: s.session_time.slice(0, 16),
      livestream_url: s.livestream_url ?? '', replay_url: s.replay_url ?? '',
      access_level: s.access_level, status: s.status,
    })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const body = {
      ...form,
      description: form.description || null,
      livestream_url: form.livestream_url || null,
      replay_url: form.replay_url || null,
    }
    if (editing) {
      await fetch('/api/admin/live-sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, updates: body }),
      })
      showToast('Session updated')
    } else {
      await fetch('/api/admin/live-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      showToast('Session scheduled')
    }
    setSaving(false)
    setPanelOpen(false)
    fetchSessions()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return
    setDeleting(id)
    await fetch('/api/admin/live-sessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    showToast('Session deleted')
    fetchSessions()
  }

  const setStatus = async (s: LiveSession, status: string) => {
    await fetch('/api/admin/live-sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, updates: { status } }),
    })
    showToast(`Status set to ${status.replace('_', ' ')}`)
    fetchSessions()
  }

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1.5">Admin</p>
            <h1 className="text-2xl font-light text-white tracking-tight">Live Sessions</h1>
            <p className="text-[#5a5a66] text-sm mt-1">{sessions.length} sessions total</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
            <Plus size={14} /> Schedule Session
          </button>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {['all', 'upcoming', 'live', 'replay_available', 'cancelled'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className="px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all"
              style={statusFilter === f
                ? { background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }
                : { background: 'rgba(255,255,255,0.04)', color: '#5a5a66', border: '1px solid rgba(255,255,255,0.07)' }
              }>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-20 text-center rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(17,17,19,0.5)' }}>
            <Radio size={24} className="text-[#3a3a46] mx-auto mb-3" />
            <p className="text-[#5a5a66] text-sm">No sessions yet</p>
            <button onClick={openCreate} className="text-[#c9a84c] text-xs mt-2 hover:underline">Schedule one →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id}
                className="p-5 rounded-2xl"
                style={{ background: 'rgba(17,17,19,0.85)', border: `1px solid ${session.status === 'live' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {session.status === 'live' && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </span>
                      )}
                      <p className="text-white font-medium truncate">{session.title}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap mt-2">
                      <SessionStatusBadge status={session.status} />
                      {session.access_level === 'gold'
                        ? <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)]">Gold</span>
                        : <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">Free</span>
                      }
                      {session.host_name && <span className="text-[#5a5a66] text-xs">Host: {session.host_name}</span>}
                      <span className="flex items-center gap-1 text-[#5a5a66] text-xs">
                        <Clock size={10} />
                        {new Date(session.session_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {session.replay_url && (
                      <a href={session.replay_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#c9a84c] text-xs mt-2 hover:underline">
                        <ExternalLink size={10} /> View Replay
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {deleting === session.id ? (
                      <Loader2 size={13} className="animate-spin text-[#c9a84c]" />
                    ) : (
                      <>
                        <button onClick={() => openEdit(session)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(session.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-all">
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick status actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
                  {['upcoming', 'live', 'replay_available', 'cancelled'].map(s => (
                    <button key={s} onClick={() => setStatus(session, s)}
                      disabled={session.status === s}
                      className="text-[9px] font-semibold uppercase px-2 py-1 rounded-lg transition-all disabled:opacity-30"
                      style={{ background: session.status === s ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)', color: session.status === s ? '#c9a84c' : '#5a5a66', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-in panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <div className="relative z-10 ml-auto w-full max-w-md h-full overflow-y-auto flex flex-col"
            style={{ background: 'rgba(10,10,11,0.98)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] sticky top-0"
              style={{ background: 'rgba(10,10,11,0.98)' }}>
              <h2 className="text-white font-medium">{editing ? 'Edit Session' : 'Schedule Session'}</h2>
              <button onClick={() => setPanelOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-4">
              {[
                { label: 'Title', key: 'title', placeholder: 'Session title' },
                { label: 'Host Name', key: 'host_name', placeholder: 'e.g. Bani' },
                { label: 'Livestream URL', key: 'livestream_url', placeholder: 'https://…' },
                { label: 'Replay URL', key: 'replay_url', placeholder: 'https://… (add after session)' },
                { label: 'Description', key: 'description', placeholder: 'What will this session cover?', multiline: true },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">{f.label}</label>
                  {f.multiline ? (
                    <textarea value={(form as Record<string, string>)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} rows={3} className="input-dark w-full text-sm resize-none" />
                  ) : (
                    <input value={(form as Record<string, string>)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} className="input-dark w-full text-sm" />
                  )}
                </div>
              ))}

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Session Time</label>
                <input type="datetime-local" value={form.session_time}
                  onChange={e => setForm(p => ({ ...p, session_time: e.target.value }))}
                  className="input-dark w-full text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Access</label>
                  <select value={form.access_level} onChange={e => setForm(p => ({ ...p, access_level: e.target.value }))}
                    className="input-dark w-full text-sm">
                    <option value="free">Free</option>
                    <option value="gold">Gold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="input-dark w-full text-sm">
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="replay_available">Replay Available</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0"
              style={{ background: 'rgba(10,10,11,0.98)' }}>
              <button onClick={handleSave} disabled={saving || !form.title || !form.session_time}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {editing ? 'Save Changes' : 'Schedule Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium z-50"
          style={{ background: 'rgba(17,17,19,0.98)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
