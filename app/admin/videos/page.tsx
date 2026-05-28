'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Plus, Search, Edit2, Trash2, Loader2, X, Play, Upload, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { muxThumbnailUrl } from '@/lib/mux'

type Video = {
  id: string; title: string; slug: string; description: string | null
  thumbnail_url: string | null; duration: string | null; category: string | null
  analyst_name: string | null; module_id: string | null; access_level: string
  status: string; release_date: string | null; created_at: string
  mux_asset_id: string | null; mux_playback_id: string | null
  mux_upload_id: string | null; processing_status: string | null
  modules?: { title: string } | null
}

const emptyForm = {
  title: '', slug: '', description: '', thumbnail_url: '',
  category: '', analyst_name: '', module_id: '',
  access_level: 'free', status: 'draft', release_date: '',
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'ready' | 'error'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    scheduled: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    draft: 'text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',
  }
  return <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[status] ?? map.draft}`}>{status}</span>
}

function AccessBadge({ level }: { level: string }) {
  return level === 'gold'
    ? <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)]">Gold</span>
    : <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">Free</span>
}

function ProcessingBadge({ status }: { status: string | null }) {
  if (!status || status === 'none') return null
  if (status === 'ready') return <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-emerald-400"><CheckCircle size={9} /> Ready</span>
  if (status === 'errored') return <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-red-400"><AlertCircle size={9} /> Error</span>
  return <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-blue-400"><Loader2 size={9} className="animate-spin" /> Processing</span>
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

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [muxAssetId, setMuxAssetId] = useState<string | null>(null)
  const [muxPlaybackId, setMuxPlaybackId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

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

  // Poll Mux for asset readiness after upload
  const startPolling = useCallback((uid: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/admin/mux?uploadId=${uid}`)
      const { upload, asset } = await res.json()
      if (asset?.status === 'ready') {
        clearInterval(pollRef.current!)
        const playbackId = asset.playback_ids?.[0]?.id
        setMuxAssetId(asset.id)
        setMuxPlaybackId(playbackId)
        setUploadState('ready')
        showToast('Video processed and ready')
      } else if (asset?.status === 'errored' || upload?.status === 'errored') {
        clearInterval(pollRef.current!)
        setUploadState('error')
        showToast('Video processing failed')
      }
    }, 4000)
  }, [])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) { showToast('Please upload a video file'); return }

    setUploadState('uploading')
    setUploadProgress(0)
    setMuxAssetId(null)
    setMuxPlaybackId(null)

    // Get direct upload URL from Mux
    const res = await fetch('/api/admin/mux', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corsOrigin: window.location.origin }),
    })
    const { uploadId: uid, uploadUrl } = await res.json()
    setUploadId(uid)

    // Upload directly to Mux
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => { setUploadState('processing'); setUploadProgress(100); resolve() }
      xhr.onerror = () => { setUploadState('error'); reject() }
      xhr.open('PUT', uploadUrl)
      xhr.send(file)
    })

    startPolling(uid)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setUploadState('idle')
    setUploadProgress(0)
    setUploadId(null)
    setMuxAssetId(null)
    setMuxPlaybackId(null)
    setPanelOpen(true)
  }

  const openEdit = (v: Video) => {
    setEditing(v)
    setForm({
      title: v.title, slug: v.slug, description: v.description ?? '',
      thumbnail_url: v.thumbnail_url ?? '', category: v.category ?? '',
      analyst_name: v.analyst_name ?? '', module_id: v.module_id ?? '',
      access_level: v.access_level, status: v.status,
      release_date: v.release_date ? v.release_date.slice(0, 16) : '',
    })
    setMuxAssetId(v.mux_asset_id)
    setMuxPlaybackId(v.mux_playback_id)
    setUploadState(v.mux_playback_id ? 'ready' : v.processing_status === 'errored' ? 'error' : v.mux_upload_id ? 'processing' : 'idle')
    setPanelOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.slug) return
    setSaving(true)

    const body = {
      ...form,
      module_id: form.module_id || null,
      release_date: form.release_date || null,
      mux_asset_id: muxAssetId || null,
      mux_playback_id: muxPlaybackId || null,
      mux_upload_id: uploadId || null,
      processing_status: uploadState === 'ready' ? 'ready' : uploadState === 'processing' ? 'preparing' : uploadState === 'error' ? 'errored' : 'none',
      thumbnail_url: form.thumbnail_url || (muxPlaybackId ? muxThumbnailUrl(muxPlaybackId) : null),
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

  const handleDelete = async (video: Video) => {
    if (!confirm('Delete this video? This cannot be undone.')) return
    setDeleting(video.id)
    await fetch('/api/admin/mux', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: video.id, muxAssetId: video.mux_asset_id }),
    })
    setDeleting(null)
    showToast('Video deleted')
    fetchVideos()
  }

  const refreshProcessing = async (video: Video) => {
    if (!video.mux_upload_id) return
    const res = await fetch(`/api/admin/mux?uploadId=${video.mux_upload_id}`)
    const { asset } = await res.json()
    if (asset?.status === 'ready') {
      const playbackId = asset.playback_ids?.[0]?.id
      await fetch('/api/admin/videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: video.id,
          updates: {
            mux_asset_id: asset.id,
            mux_playback_id: playbackId,
            processing_status: 'ready',
            duration: asset.duration ? `${Math.floor(asset.duration / 60)}:${String(Math.floor(asset.duration % 60)).padStart(2, '0')}` : null,
            thumbnail_url: video.thumbnail_url || muxThumbnailUrl(playbackId),
          },
        }),
      })
      showToast('Video is ready')
      fetchVideos()
    } else {
      showToast('Still processing…')
    }
  }

  const autoSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const thumbnailSrc = muxPlaybackId ? (form.thumbnail_url || muxThumbnailUrl(muxPlaybackId)) : form.thumbnail_url

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
            <Plus size={14} /> Upload Video
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
                }>{f}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.05)]"
            style={{ background: 'rgba(17,17,19,0.95)' }}>
            {['Title / Analyst', 'Access', 'Status', 'Video', 'Actions'].map((h, i) => (
              <div key={h} className={`text-[10px] font-semibold uppercase tracking-widest text-[#3a3a46] ${i === 0 ? 'col-span-4' : i === 4 ? 'col-span-2 text-right' : 'col-span-2'}`}>{h}</div>
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
              <button onClick={openCreate} className="text-[#c9a84c] text-xs mt-2 hover:underline">Upload your first video →</button>
            </div>
          ) : videos.map((video, idx) => (
            <div key={video.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center"
              style={{ background: idx % 2 === 0 ? 'rgba(17,17,19,0.7)' : 'rgba(12,12,14,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>

              <div className="col-span-4 flex items-center gap-3 min-w-0">
                {video.mux_playback_id || video.thumbnail_url ? (
                  <div className="w-12 h-8 rounded-lg overflow-hidden shrink-0 bg-[rgba(255,255,255,0.04)]">
                    <Image
                      src={video.thumbnail_url || muxThumbnailUrl(video.mux_playback_id!)}
                      alt="" width={48} height={32} className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Play size={10} className="text-[#3a3a46]" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">{video.title}</p>
                  <p className="text-[#5a5a66] text-[10px] mt-0.5">{video.analyst_name || '—'}{video.duration ? ` · ${video.duration}` : ''}</p>
                </div>
              </div>

              <div className="col-span-2"><AccessBadge level={video.access_level} /></div>
              <div className="col-span-2"><StatusBadge status={video.status} /></div>
              <div className="col-span-2">
                <ProcessingBadge status={video.processing_status} />
                {video.processing_status === 'preparing' && (
                  <button onClick={() => refreshProcessing(video)} className="ml-1 text-[#5a5a66] hover:text-[#c9a84c] transition-colors">
                    <RefreshCw size={10} />
                  </button>
                )}
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
                    <button onClick={() => handleDelete(video)}
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
              <h2 className="text-white font-medium">{editing ? 'Edit Video' : 'Upload Video'}</h2>
              <button onClick={() => setPanelOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5">

              {/* Video Upload Zone */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-2">Video File</label>

                {uploadState === 'idle' && (
                  <div
                    onDrop={onDrop}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex flex-col items-center justify-center gap-3 py-10 rounded-2xl cursor-pointer transition-all"
                    style={{
                      border: `2px dashed ${dragOver ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      background: dragOver ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <Upload size={22} className="text-[#5a5a66]" />
                    <div className="text-center">
                      <p className="text-white text-sm font-medium">Drop video here</p>
                      <p className="text-[#5a5a66] text-xs mt-1">or click to browse · MP4, MOV, MKV</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                  </div>
                )}

                {uploadState === 'uploading' && (
                  <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white text-sm font-medium">Uploading…</span>
                      <span className="text-[#c9a84c] text-sm font-mono">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-full rounded-full bg-[#c9a84c] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadState === 'processing' && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <Loader2 size={16} className="animate-spin text-blue-400 shrink-0" />
                    <div>
                      <p className="text-blue-400 text-sm font-medium">Processing video…</p>
                      <p className="text-[#5a5a66] text-xs mt-0.5">Mux is encoding your video. This takes 1–2 minutes.</p>
                    </div>
                  </div>
                )}

                {uploadState === 'ready' && muxPlaybackId && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                      <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-emerald-400 text-sm font-medium">Video ready</p>
                        <p className="text-[#5a5a66] text-xs mt-0.5 font-mono truncate">{muxPlaybackId}</p>
                      </div>
                      <button onClick={() => { setUploadState('idle'); setMuxAssetId(null); setMuxPlaybackId(null); setUploadId(null) }}
                        className="text-[#5a5a66] hover:text-white transition-colors text-xs">Replace</button>
                    </div>
                    {thumbnailSrc && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Image src={thumbnailSrc} alt="Thumbnail" fill className="object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {uploadState === 'error' && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-400 text-sm font-medium">Upload failed</p>
                    </div>
                    <button onClick={() => setUploadState('idle')} className="text-[#5a5a66] hover:text-white transition-colors text-xs">Retry</button>
                  </div>
                )}

                {/* For existing videos already on Mux */}
                {editing && editing.mux_playback_id && uploadState !== 'ready' && (
                  <div className="mt-3 flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                    <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-emerald-400 text-sm font-medium">Video already uploaded</p>
                      <p className="text-[#5a5a66] text-xs mt-0.5 font-mono truncate">{editing.mux_playback_id}</p>
                    </div>
                    <button onClick={() => setUploadState('idle')} className="text-[#5a5a66] hover:text-white transition-colors text-xs">Replace</button>
                  </div>
                )}
              </div>

              {/* Thumbnail override */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Custom Thumbnail URL <span className="normal-case text-[#3a3a42]">(optional — uses Mux auto-thumbnail if blank)</span></label>
                <input value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))}
                  placeholder="https://…" className="input-dark w-full text-sm" />
              </div>

              {/* Metadata fields */}
              {[
                { label: 'Title', key: 'title', placeholder: 'Video title' },
                { label: 'Slug', key: 'slug', placeholder: 'auto-generated-from-title' },
                { label: 'Analyst Name', key: 'analyst_name', placeholder: 'e.g. Bani' },
                { label: 'Category', key: 'category', placeholder: 'e.g. Psychology, Market Breakdown' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">{f.label}</label>
                  <input
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => {
                      const val = e.target.value
                      setForm(p => ({ ...p, [f.key]: val, ...(f.key === 'title' && !editing ? { slug: autoSlug(val) } : {}) }))
                    }}
                    placeholder={f.placeholder}
                    className="input-dark w-full text-sm"
                  />
                </div>
              ))}

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Short description…" rows={3} className="input-dark w-full text-sm resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Access Level</label>
                  <select value={form.access_level} onChange={e => setForm(p => ({ ...p, access_level: e.target.value }))} className="input-dark w-full text-sm">
                    <option value="free">Free</option>
                    <option value="gold">Gold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-dark w-full text-sm">
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

            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0" style={{ background: 'rgba(10,10,11,0.98)' }}>
              <button onClick={handleSave} disabled={saving || !form.title || !form.slug || uploadState === 'uploading'}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {editing ? 'Save Changes' : 'Save Video'}
              </button>
              {uploadState === 'processing' && (
                <p className="text-center text-[#5a5a66] text-xs mt-2">You can save now — video will be ready shortly</p>
              )}
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
