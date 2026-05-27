'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Loader2, X, FileText, ExternalLink } from 'lucide-react'

type Resource = {
  id: string; title: string; description: string | null; file_url: string | null
  module_id: string | null; access_level: string; status: string; created_at: string
  modules?: { title: string } | null
}

type Module = { id: string; title: string }

const emptyForm = {
  title: '', description: '', file_url: '', module_id: '',
  access_level: 'gold', status: 'draft',
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [modulesList, setModulesList] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchResources = useCallback(async () => {
    setLoading(true)
    const [resRes, modRes] = await Promise.all([
      fetch('/api/admin/resources'),
      fetch('/api/admin/modules'),
    ])
    const [resData, modData] = await Promise.all([resRes.json(), modRes.json()])
    setResources(Array.isArray(resData) ? resData : [])
    setModulesList(Array.isArray(modData) ? modData : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchResources() }, [fetchResources])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setPanelOpen(true)
  }

  const openEdit = (r: Resource) => {
    setEditing(r)
    setForm({
      title: r.title, description: r.description ?? '',
      file_url: r.file_url ?? '', module_id: r.module_id ?? '',
      access_level: r.access_level, status: r.status,
    })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const body = {
      ...form,
      description: form.description || null,
      file_url: form.file_url || null,
      module_id: form.module_id || null,
    }
    if (editing) {
      await fetch('/api/admin/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, updates: body }),
      })
      showToast('Resource updated')
    } else {
      await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      showToast('Resource created')
    }
    setSaving(false)
    setPanelOpen(false)
    fetchResources()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return
    setDeleting(id)
    await fetch('/api/admin/resources', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    showToast('Resource deleted')
    fetchResources()
  }

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1.5">Admin</p>
            <h1 className="text-2xl font-light text-white tracking-tight">Resources</h1>
            <p className="text-[#5a5a66] text-sm mt-1">{resources.length} resources</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
            <Plus size={14} /> Add Resource
          </button>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.05)]"
            style={{ background: 'rgba(17,17,19,0.95)' }}>
            {['Title', 'Module', 'Access', 'Status', 'Actions'].map((h, i) => (
              <div key={h} className={`text-[10px] font-semibold uppercase tracking-widest text-[#3a3a46] ${i === 0 ? 'col-span-4' : i === 4 ? 'col-span-2 text-right' : 'col-span-2'}`}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ background: 'rgba(17,17,19,0.7)' }}>
              <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
            </div>
          ) : resources.length === 0 ? (
            <div className="py-16 text-center" style={{ background: 'rgba(17,17,19,0.7)' }}>
              <FileText size={24} className="text-[#3a3a46] mx-auto mb-3" />
              <p className="text-[#5a5a66] text-sm">No resources yet</p>
              <button onClick={openCreate} className="text-[#c9a84c] text-xs mt-2 hover:underline">Add your first resource →</button>
            </div>
          ) : resources.map((res, idx) => (
            <div key={res.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 items-center"
              style={{
                background: idx % 2 === 0 ? 'rgba(17,17,19,0.7)' : 'rgba(12,12,14,0.7)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div className="col-span-4 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-xs font-medium truncate">{res.title}</p>
                  {res.file_url && (
                    <a href={res.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-[#3a3a46] hover:text-[#c9a84c] transition-colors shrink-0">
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                {res.description && <p className="text-[#5a5a66] text-[10px] mt-0.5 truncate">{res.description}</p>}
              </div>
              <div className="col-span-2">
                <span className="text-[#8e8e9a] text-xs">{res.modules?.title || '—'}</span>
              </div>
              <div className="col-span-2">
                {res.access_level === 'gold'
                  ? <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)]">Gold</span>
                  : <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">Free</span>
                }
              </div>
              <div className="col-span-2">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${res.status === 'published' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]'}`}>
                  {res.status}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1.5">
                {deleting === res.id ? (
                  <Loader2 size={13} className="animate-spin text-[#c9a84c]" />
                ) : (
                  <>
                    <button onClick={() => openEdit(res)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(res.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-all">
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide-in panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <div className="relative z-10 ml-auto w-full max-w-md h-full overflow-y-auto flex flex-col"
            style={{ background: 'rgba(10,10,11,0.98)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] sticky top-0"
              style={{ background: 'rgba(10,10,11,0.98)' }}>
              <h2 className="text-white font-medium">{editing ? 'Edit Resource' : 'Add Resource'}</h2>
              <button onClick={() => setPanelOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Resource title" className="input-dark w-full text-sm" />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What is this resource?" rows={3} className="input-dark w-full text-sm resize-none" />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">File URL</label>
                <input value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))}
                  placeholder="https://…" className="input-dark w-full text-sm" />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Module (optional)</label>
                <select value={form.module_id} onChange={e => setForm(p => ({ ...p, module_id: e.target.value }))}
                  className="input-dark w-full text-sm">
                  <option value="">No module</option>
                  {modulesList.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
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
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0"
              style={{ background: 'rgba(10,10,11,0.98)' }}>
              <button onClick={handleSave} disabled={saving || !form.title}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {editing ? 'Save Changes' : 'Create Resource'}
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
