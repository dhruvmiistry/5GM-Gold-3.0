'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Loader2, X, Bell, Pin } from 'lucide-react'

type Announcement = {
  id: string; title: string; body: string; audience: string
  pinned: boolean; status: string; scheduled_for: string | null
  published_at: string | null; created_at: string
}

const emptyForm = {
  title: '', body: '', audience: 'all', pinned: false,
  status: 'draft', scheduled_for: '',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    scheduled: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    draft: 'text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',
  }
  return (
    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[status] ?? map.draft}`}>
      {status}
    </span>
  )
}

function AudienceBadge({ audience }: { audience: string }) {
  const map: Record<string, string> = {
    all: 'text-[#8e8e9a] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',
    gold: 'text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border-[rgba(201,168,76,0.15)]',
    free: 'text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.07)]',
  }
  return (
    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[audience] ?? map.all}`}>
      {audience}
    </span>
  )
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    const res = await fetch(`/api/admin/announcements?${params}`)
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setPanelOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setForm({
      title: a.title, body: a.body, audience: a.audience,
      pinned: a.pinned, status: a.status,
      scheduled_for: a.scheduled_for ? a.scheduled_for.slice(0, 16) : '',
    })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const body = { ...form, scheduled_for: form.scheduled_for || null }
    if (editing) {
      await fetch('/api/admin/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, updates: body }),
      })
      showToast('Announcement updated')
    } else {
      await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      showToast('Announcement created')
    }
    setSaving(false)
    setPanelOpen(false)
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    setDeleting(id)
    await fetch('/api/admin/announcements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    showToast('Announcement deleted')
    fetchItems()
  }

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1.5">Admin</p>
            <h1 className="text-2xl font-light text-white tracking-tight">Announcements</h1>
            <p className="text-[#5a5a66] text-sm mt-1">{items.length} announcements</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
            <Plus size={14} /> New Announcement
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {['all', 'draft', 'scheduled', 'published'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className="px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all capitalize"
              style={statusFilter === f
                ? { background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }
                : { background: 'rgba(255,255,255,0.04)', color: '#5a5a66', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(17,17,19,0.5)' }}>
            <Bell size={24} className="text-[#3a3a46] mx-auto mb-3" />
            <p className="text-[#5a5a66] text-sm">No announcements</p>
            <button onClick={openCreate} className="text-[#c9a84c] text-xs mt-2 hover:underline">Create one →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id}
                className="flex items-start gap-4 px-5 py-4 rounded-2xl transition-all"
                style={{ background: 'rgba(17,17,19,0.85)', border: `1px solid ${item.pinned ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.pinned && <Pin size={11} className="text-[#c9a84c] shrink-0" />}
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  </div>
                  <p className="text-[#5a5a66] text-xs line-clamp-2 mb-2">{item.body}</p>
                  <div className="flex items-center gap-2">
                    <AudienceBadge audience={item.audience} />
                    <StatusBadge status={item.status} />
                    <span className="text-[#3a3a46] text-[10px]">
                      {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                    {item.scheduled_for && (
                      <span className="text-[#5a5a66] text-[10px]">
                        · scheduled {new Date(item.scheduled_for).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {deleting === item.id ? (
                    <Loader2 size={13} className="animate-spin text-[#c9a84c]" />
                  ) : (
                    <>
                      <button onClick={() => openEdit(item)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-all">
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
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
              <h2 className="text-white font-medium">{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setPanelOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Announcement title" className="input-dark w-full text-sm" />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Body</label>
                <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  placeholder="Announcement content…" rows={6}
                  className="input-dark w-full text-sm resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Audience</label>
                  <select value={form.audience} onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
                    className="input-dark w-full text-sm">
                    <option value="all">All Members</option>
                    <option value="free">Free Only</option>
                    <option value="gold">Gold Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="input-dark w-full text-sm">
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {form.status === 'scheduled' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Scheduled For</label>
                  <input type="datetime-local" value={form.scheduled_for}
                    onChange={e => setForm(p => ({ ...p, scheduled_for: e.target.value }))}
                    className="input-dark w-full text-sm" />
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm(p => ({ ...p, pinned: !p.pinned }))}
                  className={`w-9 h-5 rounded-full transition-all relative ${form.pinned ? 'bg-[rgba(201,168,76,0.4)]' : 'bg-[rgba(255,255,255,0.08)]'}`}
                  style={{ border: `1px solid ${form.pinned ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                  <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${form.pinned ? 'left-[18px] bg-[#c9a84c]' : 'left-0.5 bg-[#5a5a66]'}`} />
                </div>
                <span className="text-[#8e8e9a] text-sm">Pin this announcement</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0"
              style={{ background: 'rgba(10,10,11,0.98)' }}>
              <button onClick={handleSave} disabled={saving || !form.title || !form.body}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {editing ? 'Save Changes' : 'Create Announcement'}
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
