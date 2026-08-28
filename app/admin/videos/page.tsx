'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Plus, Search, Edit2, Trash2, Loader2, X, Play, Upload, RefreshCw, CheckCircle, AlertCircle, ImageIcon } from 'lucide-react'
import { muxThumbnailUrl } from '@/lib/mux'
import { londonTimeToUTCISOString, utcISOStringToLondonLocal } from '@/lib/utils'

type Video = {
  id: string; title: string; slug: string; description: string | null
  thumbnail_url: string | null; duration: string | null; category: string | null
  analyst_name: string | null; module_id: string | null; access_level: string
  status: string; release_date: string | null; created_at: string
  mux_asset_id: string | null; mux_playback_id: string | null
  mux_upload_id: string | null; processing_status: string | null
  sort_order: number
  modules?: { title: string } | null
}

type ModuleOption = { id: string; title: string; access_level: string; videoCount: number }

const SECTIONS = [
  { label: 'Free Videos',        category: 'Free Video',       access_level: 'free' },
  { label: 'Market Breakdowns',  category: 'Market Breakdown', access_level: 'gold' },
  { label: 'Psychology & Risk',  category: 'Psychology',       access_level: 'free' },
  { label: 'Weekly Outlooks',    category: 'Weekly Outlook',   access_level: 'gold' },
  { label: 'Gold Content',       category: 'Gold',             access_level: 'gold' },
]

// 'standalone' = a normal video slotted into one of the fixed sections above.
// 'course' = a lesson inside a structured module (e.g. The Reset) — access
// level is inherited from the module, and it never appears in Free Videos.
type Placement = 'standalone' | 'course'

const emptyForm = {
  title: '', slug: '', description: '', thumbnail_url: '',
  placement: 'standalone' as Placement,
  section: 'Free Videos', analyst_name: '',
  module_id: '', stage: '', sort_order: 0,
  status: 'draft', release_date: '',
}

function SectionHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5 pt-1">
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.22)' }}>
        {step}
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8e8e9a]">{title}</p>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
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
  const [modules, setModules] = useState<ModuleOption[]>([])
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

  // Thumbnail state
  const [thumbnailMode, setThumbnailMode] = useState<'url' | 'file'>('url')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const thumbnailFileRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    fetch('/api/admin/modules')
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any[]) => setModules(Array.isArray(data) ? data.map(m => ({
        id: m.id, title: m.title, access_level: m.access_level, videoCount: m.videos?.[0]?.count ?? 0,
      })) : []))
      .catch(() => {})
  }, [])

  // Poll Mux for asset readiness after upload
  const startPolling = useCallback((uid: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/admin/mux?uploadId=${uid}`)
      if (!res.ok) return
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

  const handleThumbnailFile = (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('Please select an image file'); return }
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

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
    const data = await res.json()
    if (!res.ok || !data.uploadUrl) {
      setUploadState('error')
      showToast(data.error || `Server error ${res.status} — check console`)
      console.error('Mux upload init failed:', data)
      return
    }
    const { uploadId: uid, uploadUrl } = data
    setUploadId(uid)

    // Upload directly to Mux
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadState('processing'); setUploadProgress(100); resolve()
        } else {
          setUploadState('error')
          showToast(`Mux upload failed — HTTP ${xhr.status}`)
          console.error('Mux XHR error:', xhr.status, xhr.responseText)
          reject()
        }
      }
      xhr.onerror = () => {
        setUploadState('error')
        showToast('Network error during upload — check console')
        console.error('Mux XHR network error. Upload URL was:', uploadUrl)
        reject()
      }
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
    setThumbnailMode('url')
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setPanelOpen(true)
  }

  const openEdit = (v: Video) => {
    setEditing(v)
    const isCourse = !!v.module_id
    const matchedSection = SECTIONS.find(s => s.category === v.category && s.access_level === v.access_level)
    setForm({
      title: v.title, slug: v.slug, description: v.description ?? '',
      thumbnail_url: v.thumbnail_url ?? '',
      placement: isCourse ? 'course' : 'standalone',
      section: matchedSection?.label ?? 'Free Videos',
      analyst_name: v.analyst_name ?? '',
      module_id: v.module_id ?? '', stage: isCourse ? (v.category ?? '') : '', sort_order: v.sort_order ?? 0,
      status: v.status,
      release_date: v.release_date ? utcISOStringToLondonLocal(v.release_date) : '',
    })
    setMuxAssetId(v.mux_asset_id)
    setMuxPlaybackId(v.mux_playback_id)
    setUploadState(v.mux_playback_id ? 'ready' : v.processing_status === 'errored' ? 'error' : v.mux_upload_id ? 'processing' : 'idle')
    setThumbnailMode('url')
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setPanelOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.slug) return
    if (form.status === 'scheduled' && !form.release_date) {
      showToast('Set a release date before scheduling this video')
      return
    }
    if (form.placement === 'course' && !form.module_id) {
      showToast('Pick a course, or switch back to Standalone')
      return
    }
    setSaving(true)

    let resolvedThumbnailUrl = form.thumbnail_url
    if (thumbnailMode === 'file' && thumbnailFile) {
      setThumbnailUploading(true)
      const fd = new FormData()
      fd.append('file', thumbnailFile)
      const res = await fetch('/api/admin/upload-thumbnail', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data.url) {
        resolvedThumbnailUrl = data.url
      } else {
        showToast(data.error || 'Thumbnail upload failed')
        setSaving(false)
        setThumbnailUploading(false)
        return
      }
      setThumbnailUploading(false)
    }

    const selectedSection = SECTIONS.find(s => s.label === form.section) ?? SECTIONS[0]
    const selectedModule = modules.find(m => m.id === form.module_id)
    const isCourse = form.placement === 'course' && !!selectedModule

    const body = {
      title: form.title,
      slug: form.slug,
      description: form.description || null,
      analyst_name: form.analyst_name || null,
      module_id: isCourse ? selectedModule!.id : null,
      sort_order: isCourse ? (form.sort_order || 0) : 0,
      release_date: form.release_date ? londonTimeToUTCISOString(form.release_date) : null,
      status: form.status,
      category: isCourse ? (form.stage || selectedModule!.title) : selectedSection.category,
      access_level: isCourse ? selectedModule!.access_level : selectedSection.access_level,
      mux_asset_id: muxAssetId || null,
      mux_playback_id: muxPlaybackId || null,
      mux_upload_id: uploadId || null,
      processing_status: uploadState === 'ready' ? 'ready' : uploadState === 'processing' ? 'preparing' : uploadState === 'error' ? 'errored' : 'none',
      thumbnail_url: resolvedThumbnailUrl || (muxPlaybackId ? muxThumbnailUrl(muxPlaybackId) : null),
    }

    if (editing) {
      const res = await fetch('/api/admin/videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, updates: body }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Update failed'); setSaving(false); return }
      showToast('Video updated')
    } else {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Create failed'); setSaving(false); return }
      showToast('Video created')
    }

    setSaving(false)
    setPanelOpen(false)
    fetchVideos()
  }

  // Closing the panel without saving must not leave an unsaved Mux asset behind —
  // otherwise it silently eats into the account's asset quota with no way to find it again.
  const closePanel = async () => {
    if (uploadId) {
      const persistedAssetId = editing?.mux_asset_id ?? null
      let assetIdToDelete = muxAssetId
      if (!assetIdToDelete) {
        try {
          const res = await fetch(`/api/admin/mux?uploadId=${uploadId}`)
          if (res.ok) {
            const { asset } = await res.json()
            assetIdToDelete = asset?.id ?? null
          }
        } catch {
          // best effort
        }
      }
      if (assetIdToDelete && assetIdToDelete !== persistedAssetId) {
        fetch('/api/admin/mux', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ muxAssetId: assetIdToDelete }),
        }).catch(() => {})
      }
    }
    setPanelOpen(false)
  }

  const handleDelete = async (video: Video) => {
    if (!confirm('Delete this video? This cannot be undone.')) return
    setDeleting(video.id)
    const res = await fetch('/api/admin/mux', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: video.id, muxAssetId: video.mux_asset_id }),
    })
    setDeleting(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Delete failed'); return }
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePanel} />
          <div className="relative z-10 ml-auto w-full max-w-lg h-full overflow-y-auto flex flex-col"
            style={{ background: 'rgba(10,10,11,0.98)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] sticky top-0 z-10"
              style={{ background: 'rgba(10,10,11,0.98)' }}>
              <h2 className="text-white font-medium">{editing ? 'Edit Video' : 'Upload Video'}</h2>
              <button onClick={closePanel}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5">

              <SectionHeader step={1} title="Video File" />
              <div>

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

              {/* Thumbnail — optional, part of the video step */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#3a3a42]">
                    Thumbnail <span className="normal-case">(optional — Mux auto-generates one)</span>
                  </label>
                  <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    {(['url', 'file'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setThumbnailMode(mode)}
                        className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all"
                        style={thumbnailMode === mode
                          ? { background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }
                          : { background: 'transparent', color: '#5a5a66' }}
                      >
                        {mode === 'url' ? 'URL' : 'File'}
                      </button>
                    ))}
                  </div>
                </div>

                {thumbnailMode === 'url' ? (
                  <input
                    value={form.thumbnail_url}
                    onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))}
                    placeholder="https://… (leave blank to use Mux auto-thumbnail)"
                    className="input-dark w-full text-sm"
                  />
                ) : (
                  <div>
                    <div
                      onClick={() => thumbnailFileRef.current?.click()}
                      className="relative flex flex-col items-center justify-center gap-2 py-6 rounded-xl cursor-pointer transition-all"
                      style={{
                        border: '2px dashed rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <ImageIcon size={18} className="text-[#5a5a66]" />
                      <p className="text-[#5a5a66] text-xs">{thumbnailFile ? thumbnailFile.name : 'Click to choose an image'}</p>
                      <input
                        ref={thumbnailFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbnailFile(f) }}
                      />
                    </div>
                    {thumbnailPreview && (
                      <div className="relative mt-2 w-full aspect-video rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Image src={thumbnailPreview} alt="Thumbnail preview" fill className="object-cover" />
                        <button
                          onClick={() => { setThumbnailFile(null); setThumbnailPreview(null) }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <SectionHeader step={2} title="Details" />

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Title</label>
                <input
                  value={form.title}
                  onChange={e => {
                    const val = e.target.value
                    setForm(p => ({ ...p, title: val, ...(!editing ? { slug: autoSlug(val) } : {}) }))
                  }}
                  placeholder="Video title"
                  className="input-dark w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Analyst</label>
                <input
                  value={form.analyst_name}
                  onChange={e => setForm(p => ({ ...p, analyst_name: e.target.value }))}
                  placeholder="e.g. Bani"
                  className="input-dark w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">
                  Description <span className="normal-case">(optional)</span>
                </label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Short description…" rows={3} className="input-dark w-full text-sm resize-none" />
              </div>

              <SectionHeader step={3} title="Where It Lives" />

              {/* Standalone vs. course — one decision instead of two overlapping dropdowns */}
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                {([
                  { key: 'standalone' as Placement, label: 'Standalone' },
                  { key: 'course' as Placement, label: 'Inside a Course' },
                ]).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setForm(p => ({ ...p, placement: opt.key }))}
                    className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all"
                    style={form.placement === opt.key
                      ? { background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }
                      : { background: 'transparent', color: '#5a5a66' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {form.placement === 'standalone' ? (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Section</label>
                  <select
                    value={form.section}
                    onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
                    className="input-dark w-full text-sm"
                  >
                    {SECTIONS.map(s => (
                      <option key={s.label} value={s.label}>{s.label} ({s.access_level === 'gold' ? 'Gold only' : 'Free'})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-[#5a5a66] mt-1.5">
                    Shows up in the {form.section} list on the member dashboard.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Course</label>
                    {modules.length === 0 ? (
                      <p className="text-[#5a5a66] text-xs px-1">
                        No courses yet — create one under Admin → Modules first.
                      </p>
                    ) : (
                      <select
                        value={form.module_id}
                        onChange={e => {
                          const mod = modules.find(m => m.id === e.target.value)
                          setForm(p => ({ ...p, module_id: e.target.value, sort_order: mod ? mod.videoCount + 1 : p.sort_order }))
                        }}
                        className="input-dark w-full text-sm"
                      >
                        <option value="">Select a course…</option>
                        {modules.map(m => (
                          <option key={m.id} value={m.id}>{m.title} ({m.access_level === 'gold' ? 'Gold' : 'Free'} · {m.videoCount} lesson{m.videoCount === 1 ? '' : 's'})</option>
                        ))}
                      </select>
                    )}
                    <p className="text-[10px] text-[#5a5a66] mt-1.5">
                      Access level is inherited from the course. This won&apos;t appear in Free Videos.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">
                        Stage <span className="normal-case">(optional)</span>
                      </label>
                      <input
                        value={form.stage}
                        onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                        placeholder="e.g. Foundations"
                        className="input-dark w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">
                        Lesson Order
                      </label>
                      <input
                        type="number" min={0}
                        value={form.sort_order}
                        onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))}
                        className="input-dark w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              <SectionHeader step={4} title="Publish" />

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-dark w-full text-sm">
                  <option value="draft">Draft — not visible to members</option>
                  <option value="scheduled">Scheduled — goes live on release date</option>
                  <option value="published">Published — live now</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">
                  Release Date (UK time){form.status === 'scheduled' && <span className="text-[#c9a84c]"> *required</span>}
                </label>
                <input type="datetime-local" value={form.release_date}
                  onChange={e => setForm(p => ({ ...p, release_date: e.target.value }))}
                  required={form.status === 'scheduled'}
                  className="input-dark w-full text-sm" />
                {form.status === 'scheduled' && !form.release_date && (
                  <p className="text-[10px] text-red-400 mt-1">Required — otherwise this video publishes immediately instead of scheduling</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0" style={{ background: 'rgba(10,10,11,0.98)' }}>
              <button onClick={handleSave} disabled={saving || !form.title || !form.slug || uploadState === 'uploading' || (form.status === 'scheduled' && !form.release_date) || (form.placement === 'course' && !form.module_id)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
                {(saving || thumbnailUploading) ? <Loader2 size={14} className="animate-spin" /> : null}
                {thumbnailUploading ? 'Uploading thumbnail…' : editing ? 'Save Changes' : 'Save Video'}
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
