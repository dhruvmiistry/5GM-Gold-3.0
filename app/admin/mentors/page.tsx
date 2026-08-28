'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Loader2, Search, Plus, X, Trash2, UserCheck, Clock } from 'lucide-react'

type MentorRow = {
  profile_id: string; display_name: string; active: boolean
  call_duration_minutes: number; buffer_minutes: number; min_notice_hours: number; max_horizon_days: number
  profiles: { full_name: string | null; email: string | null; role: string } | null
}
type Candidate = { id: string; full_name: string | null; email: string | null; role: string }

export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState<MentorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const [panelOpen, setPanelOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const loadMentors = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/mentors')
      .then(r => r.json())
      .then(data => { setMentors(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadMentors() }, [loadMentors])

  useEffect(() => {
    if (!search.trim()) { setCandidates([]); return }
    const t = setTimeout(() => {
      fetch(`/api/admin/mentors?search=${encodeURIComponent(search)}`)
        .then(r => r.json())
        .then(data => setCandidates(Array.isArray(data) ? data : []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const openAssign = () => {
    setSelected(null); setSearch(''); setCandidates([]); setDisplayName(''); setPanelOpen(true)
  }

  const pickCandidate = (c: Candidate) => {
    setSelected(c)
    setDisplayName(c.full_name ?? '')
    setCandidates([])
    setSearch('')
  }

  const confirmAssign = async () => {
    if (!selected || !displayName.trim()) return
    setSaving(true)
    const res = await fetch('/api/admin/mentors', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: selected.id, displayName: displayName.trim() }),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Failed to assign'); return }
    showToast('Mentor assigned')
    setPanelOpen(false)
    loadMentors()
  }

  const updateField = async (profileId: string, field: string, value: number | boolean) => {
    const res = await fetch(`/api/admin/mentors/${profileId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Update failed'); return }
    loadMentors()
  }

  const removeMentor = async (profileId: string) => {
    if (!confirm('Remove mentor role from this account?')) return
    const res = await fetch(`/api/admin/mentors/${profileId}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Remove failed'); return }
    showToast('Mentor removed')
    loadMentors()
  }

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1.5">Admin</p>
            <h1 className="text-2xl font-light text-white tracking-tight">Mentors</h1>
            <p className="text-[#5a5a66] text-sm mt-1">{mentors.length} mentors</p>
          </div>
          <button onClick={openAssign}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
            <Plus size={14} /> Assign Mentor
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-[#c9a84c]" /></div>
        ) : mentors.length === 0 ? (
          <div className="py-16 text-center rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(17,17,19,0.5)' }}>
            <UserCheck size={22} className="text-[#3a3a46] mx-auto mb-3" />
            <p className="text-[#5a5a66] text-sm">No mentors assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mentors.map(m => (
              <div key={m.profile_id} className="p-5 rounded-2xl" style={{ background: 'rgba(17,17,19,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white text-sm font-medium">{m.display_name}</p>
                    <p className="text-[#5a5a66] text-xs mt-0.5">{m.profiles?.email ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-[#8e8e9a]">
                      <input type="checkbox" checked={m.active} onChange={e => updateField(m.profile_id, 'active', e.target.checked)} />
                      Active
                    </label>
                    <button onClick={() => removeMentor(m.profile_id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'call_duration_minutes', label: 'Duration (min)' },
                    { key: 'buffer_minutes', label: 'Buffer (min)' },
                    { key: 'min_notice_hours', label: 'Min notice (hrs)' },
                    { key: 'max_horizon_days', label: 'Max horizon (days)' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[9px] uppercase tracking-widest text-[#3a3a42] mb-1">{f.label}</label>
                      <input type="number" min={0}
                        defaultValue={(m as unknown as Record<string, number>)[f.key]}
                        onBlur={e => updateField(m.profile_id, f.key, Number(e.target.value))}
                        className="input-dark w-full text-sm" />
                    </div>
                  ))}
                </div>
                <Link href={`/admin/mentors/${m.profile_id}/availability`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#8e8e9a] hover:text-[#c9a84c] transition-colors">
                  <Clock size={12} /> Manage availability
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <div className="relative z-10 ml-auto w-full max-w-md h-full overflow-y-auto flex flex-col"
            style={{ background: 'rgba(10,10,11,0.98)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-white font-medium">Assign Mentor</h2>
              <button onClick={() => setPanelOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4">
              {!selected ? (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Find account</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a5a66]" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or email…" className="input-dark pl-9 w-full text-sm" />
                  </div>
                  <div className="mt-2 space-y-1">
                    {candidates.map(c => (
                      <button key={c.id} onClick={() => pickCandidate(c)}
                        className="w-full text-left p-3 rounded-xl transition-all hover:bg-[rgba(255,255,255,0.04)]"
                        style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-white text-sm">{c.full_name ?? '—'}</p>
                        <p className="text-[#5a5a66] text-xs">{c.email} · {c.role}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="p-3 rounded-xl mb-4 flex items-center justify-between" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
                    <div>
                      <p className="text-white text-sm">{selected.full_name}</p>
                      <p className="text-[#5a5a66] text-xs">{selected.email}</p>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-[#5a5a66] hover:text-white text-xs">Change</button>
                  </div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Display name</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="input-dark w-full text-sm" />
                </div>
              )}
            </div>
            {selected && (
              <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)]">
                <button onClick={confirmAssign} disabled={saving || !displayName.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Assign as Mentor
                </button>
              </div>
            )}
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
