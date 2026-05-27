'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Loader2, X, Play, Eye, EyeOff } from 'lucide-react'

type Video = {
  id: string; title: string; slug: string; description: string | null
  video_url: string | null; embed_url: string | null; thumbnail_url: string | null
  duration: string | null; category: string | null; analyst_name: string | null
  module_id: string | null; access_level: string; status: string
  release_date: string | null; created_at: string
  modules?: { title: string } | null
}

const emptyForm = {
  title: '', slug: '', description: '', video_url: '', embed_url: '',
  thumbnail_url: '', duration: '', category: '', analyst_name: '',
  module_id: '', access_level: 'free', status: 'draft', release_date: '',
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

function AccessBadge({ level }: { level: string }) {
  return level === 'gold'
    ? <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)]">Gold</span>
    : <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">Free</span>
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Video | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    const res = await fetch(`/api/admin/videos?${params}`)
    const data = await res.json()
    setVideos(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setPanelOpen(true)
  }

  const openEdit = (v: Video) => {
    setEditing(v)
    setForm({
      title: v.title, slug: v.slug, description: v.description ?? '',
      video_url: v.video_url ?? '', embed_url: v.embed_url ?? '',
      thumbnail_url: v.thumbnail_url ?? '', duration: v.duration ?? '',
      category: v.category ?? '', analyst_name: v.analyst_name ?? '',
      module_id: v.module_id ?? '', access_level: v.access_level,
      status: v.status, release_date: v.release_date ? v.release_date.slice(0, 16) : '',
    })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const body = {
      ...form,
      module_id: form.module_id || null,
      release_date: form.release_date || null,
    }
    if (editing) {
      await fetch('/api/admin/videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, updates: body }),
      })
      showToast('Video updated')
    } else {
      await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      showToast('Video created')
    }
    setSaving(false)
    setPanelOpen(false)
    fetchVideos()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return
    setDeleting(id)
    await fetch('/api/admin/videos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    showToast('Video deleted')
    fetchVideos()
  }

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1.5">Admin</p>
            <h1 className="text-2xl font-light text-white tracking-tight">Videos</h1>
            <p className="text-[#5a5a66] text-sm mt-1">{videos.length} videos total</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
            <Plus size={14} /> Add Video
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a5a66]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search videos…" className="input-dark pl-9 w-full text-sm" />
          </div>
          <div className="flex gap-2">
            {['all', 'draft', 'scheduled', 'published'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all capitalize"
                style={statusFilter === f
                  ? { background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }
                  : { background: 'rgba(255,255,255,0.04)', color: '#5a5a66', border: '1px solid rgba(255,255,255,0.07)' }
                }
              >{f}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.05)]"
            style={{ background: 'rgba(17,17,19,0.95)' }}>
            {['Title / Analyst', 'Access', 'Status', 'Duration', 'Actions'].map((h, i) => (
              <div key={h} className={`text-[10px] font-semibold uppercase tracking-widest text-[#3a3a46] ${i === 0 ? 'col-span-5' : i === 4 ? 'col-span-2 text-right' : 'col-span-2'}`}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ background: 'rgba(17,17,19,0.7)' }}>
              <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
            </div>
          ) : videos.length === 0 ? (
            <div className="py-16 text-center" style={{ background: 'rgba(17,17,19,0.7)' }}>
              <Play size={24} className="text-[#3a3a46] mx-auto mb-3" />
              <p className="text-[#5a5a66] text-sm">No videos yet</p>
              <button onClick={openCreate} className="text-[#c9a84c] text-xs mt-2 hover:underline">Add your first video →</button>
            </div>
          ) : videos.map((video, idx) => (
            <div key={video.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 items-center"
              style={{
                background: idx % 2 === 0 ? 'rgba(17,17,19,0.7)' : 'rgba(12,12,14,0.7)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div className="col-span-5 min-w-0">
                <p className="text-white text-xs font-medium truncate">{video.title}</p>
                <p className="text-[#5a5a66] text-[10px] mt-0.5">{video.analyst_name || '—'} {video.modules ? `· ${video.modules.title}` : ''}</p>
              </div>
              <div className="col-span-2"><AccessBadge level={video.access_level} /></div>
              <div className="col-span-2"><StatusBadge status={video.status} /></div>
              <div className="col-span-1">
                <span className="text-[#8e8e9a] text-xs">{video.duration || '—'}</span>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1.5">
                {deleting === video.id ? (
                  <Loader2 size={13} className="animate-spin text-[#c9a84c]" />
                ) : (
                  <>
                    <button onClick={() => openEdit(video)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(video.id)}
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
          <div className="relative z-10 ml-auto w-full max-w-lg h-full overflow-y-auto flex flex-col"
            style={{ background: 'rgba(10,10,11,0.98)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] sticky top-0 z-10"
              style={{ background: 'rgba(10,10,11,0.98)' }}>
              <h2 className="text-white font-medium">{editing ? 'Edit Video' : 'Add Video'}</h2>
              <button onClick={() => setPanelOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-4">
              {[
                { label: 'Title', key: 'title', placeholder: 'Video title' },
                { label: 'Slug', key: 'slug', placeholder: 'auto-generated-from-title' },
                { label: 'Analyst Name', key: 'analyst_name', placeholder: 'e.g. Bani' },
                { label: 'Category', key: 'category', placeholder: 'e.g. Psychology, Market Breakdown' },
                { label: 'Duration', key: 'duration', placeholder: 'e.g. 12:34' },
                { label: 'Video URL', key: 'video_url', placeholder: 'https://…' },
                { label: 'Embed URL', key: 'embed_url', placeholder: 'https://…' },
                { label: 'Thumbnail URL', key: 'thumbnail_url', placeholder: 'https://…' },
                { label: 'Description', key: 'description', placeholder: 'Short description…', multiline: true },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">{f.label}</label>
                  {f.multiline ? (
                    <textarea
                      value={(form as Record<string, string>)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      rows={3}
                      className="input-dark w-full text-sm resize-none"
                    />
                  ) : (
                    <input
                      value={(form as Record<string, string>)[f.key]}
                      onChange={e => {
                        const val = e.target.value
                        setForm(p => ({
                          ...p,
                          [f.key]: val,
                          ...(f.key === 'title' && !editing ? { slug: autoSlug(val) } : {}),
                        }))
                      }}
                      placeholder={f.placeholder}
                      className="input-dark w-full text-sm"
                    />
                  )}
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Access Level</label>
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
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Release Date</label>
                <input type="datetime-local" value={form.release_date}
                  onChange={e => setForm(p => ({ ...p, release_date: e.target.value }))}
                  className="input-dark w-full text-sm" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0"
              style={{ background: 'rgba(10,10,11,0.98)' }}>
              <button onClick={handleSave} disabled={saving || !form.title || !form.slug}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {editing ? 'Save Changes' : 'Create Video'}
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
