'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Loader2, X, BookOpen, GripVertical } from 'lucide-react'

type Module = {
  id: string; title: string; slug: string; description: string | null
  thumbnail_url: string | null; access_level: string; status: string
  sort_order: number; created_at: string
  videos?: { count: number }[]
}

const emptyForm = {
  title: '', slug: '', description: '', thumbnail_url: '',
  access_level: 'gold', status: 'draft', sort_order: 0,
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

export default function AdminModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Module | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchModules = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/modules')
    const data = await res.json()
    setModules(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchModules() }, [fetchModules])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, sort_order: modules.length })
    setPanelOpen(true)
  }

  const openEdit = (m: Module) => {
    setEditing(m)
    setForm({
      title: m.title, slug: m.slug, description: m.description ?? '',
      thumbnail_url: m.thumbnail_url ?? '', access_level: m.access_level,
      status: m.status, sort_order: m.sort_order,
    })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    if (editing) {
      const res = await fetch('/api/admin/modules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, updates: form }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Update failed'); setSaving(false); return }
      showToast('Module updated')
    } else {
      const res = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Create failed'); setSaving(false); return }
      showToast('Module created')
    }
    setSaving(false)
    setPanelOpen(false)
    fetchModules()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this module? All linked videos will be unlinked.')) return
    setDeleting(id)
    const res = await fetch('/api/admin/modules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Delete failed'); return }
    showToast('Module deleted')
    fetchModules()
  }

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1.5">Admin</p>
            <h1 className="text-2xl font-light text-white tracking-tight">Modules</h1>
            <p className="text-[#5a5a66] text-sm mt-1">{modules.length} modules · ordered by sort order</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
            <Plus size={14} /> Add Module
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
          </div>
        ) : modules.length === 0 ? (
          <div className="py-20 text-center rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(17,17,19,0.5)' }}>
            <BookOpen size={24} className="text-[#3a3a46] mx-auto mb-3" />
            <p className="text-[#5a5a66] text-sm">No modules yet</p>
            <button onClick={openCreate} className="text-[#c9a84c] text-xs mt-2 hover:underline">Create your first module →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {modules.map(mod => (
              <div key={mod.id}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all"
                style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <GripVertical size={14} className="text-[#3a3a46] shrink-0 cursor-grab" />
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[#c9a84c] text-xs font-bold"
                  style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                  {mod.sort_order + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{mod.title}</p>
                  <p className="text-[#5a5a66] text-xs mt-0.5">{mod.slug}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {mod.access_level === 'gold'
                    ? <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)]">Gold</span>
                    : <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">Free</span>
                  }
                  <StatusBadge status={mod.status} />
                  <span className="text-[#3a3a46] text-xs">{mod.videos?.[0]?.count ?? 0} videos</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {deleting === mod.id ? (
                    <Loader2 size={13} className="animate-spin text-[#c9a84c]" />
                  ) : (
                    <>
                      <button onClick={() => openEdit(mod)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => handleDelete(mod.id)}
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
              <h2 className="text-white font-medium">{editing ? 'Edit Module' : 'Add Module'}</h2>
              <button onClick={() => setPanelOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-4">
              {[
                { label: 'Title', key: 'title', placeholder: 'Module title' },
                { label: 'Slug', key: 'slug', placeholder: 'module-slug' },
                { label: 'Thumbnail URL', key: 'thumbnail_url', placeholder: 'https://…' },
                { label: 'Description', key: 'description', placeholder: 'Short description…', multiline: true },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">{f.label}</label>
                  {f.multiline ? (
                    <textarea value={(form as Record<string, string | number>)[f.key] as string}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} rows={3} className="input-dark w-full text-sm resize-none" />
                  ) : (
                    <input value={(form as Record<string, string | number>)[f.key] as string}
                      onChange={e => {
                        const val = e.target.value
                        setForm(p => ({
                          ...p,
                          [f.key]: val,
                          ...(f.key === 'title' && !editing ? { slug: autoSlug(val) } : {}),
                        }))
                      }}
                      placeholder={f.placeholder} className="input-dark w-full text-sm" />
                  )}
                </div>
              ))}

              <div className="grid grid-cols-3 gap-3">
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
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Sort Order</label>
                  <input type="number" min={0} value={form.sort_order}
                    onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))}
                    className="input-dark w-full text-sm" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0"
              style={{ background: 'rgba(10,10,11,0.98)' }}>
              <button onClick={handleSave} disabled={saving || !form.title || !form.slug}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {editing ? 'Save Changes' : 'Create Module'}
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
