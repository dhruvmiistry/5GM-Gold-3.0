'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Loader2, Upload, CheckCircle, AlertCircle, Play, X, Plus, RotateCcw, Edit2, Trash2,
} from 'lucide-react'
import { muxThumbnailUrl } from '@/lib/mux'
import { resetLessons, type ResetLesson } from '@/lib/mockData'

type ModuleRow = { id: string; title: string; slug: string; access_level: string; status: string }
type VideoRow = {
  id: string; title: string; module_id: string | null; sort_order: number
  status: string; processing_status: string | null
  mux_asset_id: string | null; mux_playback_id: string | null; mux_upload_id: string | null
  thumbnail_url: string | null
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'ready' | 'error'

function groupByStage(lessons: ResetLesson[]) {
  const stages = Array.from(new Set(lessons.map(l => l.stage)))
  return stages.map(stage => ({ stage, lessons: lessons.filter(l => l.stage === stage) }))
}

export default function AdminTheResetPage() {
  const [loading, setLoading] = useState(true)
  const [module, setModule] = useState<ModuleRow | null>(null)
  const [creatingModule, setCreatingModule] = useState(false)
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [activeLesson, setActiveLesson] = useState<ResetLesson | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  const load = useCallback(async () => {
    setLoading(true)
    const [modulesRes, videosRes] = await Promise.all([
      fetch('/api/admin/modules').then(r => r.json()),
      fetch('/api/admin/videos').then(r => r.json()),
    ])
    const found = Array.isArray(modulesRes) ? modulesRes.find((m: ModuleRow) => m.slug === 'the-reset') : null
    setModule(found ?? null)
    setVideos(Array.isArray(videosRes) && found ? videosRes.filter((v: VideoRow) => v.module_id === found.id) : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const videoBySlot = useMemo(() => {
    const map = new Map<number, VideoRow>()
    for (const v of videos) map.set(v.sort_order, v)
    return map
  }, [videos])

  const uploadedCount = resetLessons.filter(l => videoBySlot.has(l.number)).length

  const createModule = async () => {
    setCreatingModule(true)
    const res = await fetch('/api/admin/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'The Reset', slug: 'the-reset',
        description: 'Free 20-lesson beginner course from the 5GM mentors.',
        access_level: 'free', status: 'published', sort_order: 0,
      }),
    })
    setCreatingModule(false)
    if (!res.ok) { showToast('Could not create the course — check Admin → Modules'); return }
    showToast('The Reset course created')
    load()
  }

  if (loading) {
    return (
      <div className="dashboard-bg min-h-full flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
      </div>
    )
  }

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1.5">Admin</p>
            <h1 className="text-2xl font-light text-white tracking-tight">The Reset</h1>
            <p className="text-[#5a5a66] text-sm mt-1">
              {module ? `${uploadedCount} of ${resetLessons.length} lessons uploaded` : 'Course not created yet'}
            </p>
          </div>
        </div>

        {!module ? (
          <div className="py-16 text-center rounded-2xl" style={{ border: '1px solid rgba(201,168,76,0.18)', background: 'rgba(17,17,19,0.7)' }}>
            <RotateCcw size={22} className="text-[#c9a84c] mx-auto mb-3" />
            <p className="text-white text-sm font-medium mb-1">The Reset course hasn&apos;t been created yet</p>
            <p className="text-[#5a5a66] text-xs mb-4">This sets up the module (Free, Published) so lessons can be uploaded below.</p>
            <button onClick={createModule} disabled={creatingModule}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
              {creatingModule ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create The Reset Course
            </button>
          </div>
        ) : (
          <>
            {/* Overall progress */}
            <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(uploadedCount / resetLessons.length) * 100}%`, background: '#c9a84c' }} />
            </div>

            <div className="space-y-7">
              {groupByStage(resetLessons).map((group, gi) => (
                <motion.div key={group.stage}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: gi * 0.05 }}
                >
                  <p className="section-label mb-3">{group.stage}</p>
                  <div className="space-y-2">
                    {group.lessons.map(lesson => (
                      <LessonRow
                        key={lesson.number}
                        lesson={lesson}
                        video={videoBySlot.get(lesson.number) ?? null}
                        onOpen={() => setActiveLesson(lesson)}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {module && activeLesson && (
        <LessonPanel
          module={module}
          lesson={activeLesson}
          video={videoBySlot.get(activeLesson.number) ?? null}
          onClose={() => setActiveLesson(null)}
          onSaved={() => { setActiveLesson(null); load() }}
          onDeleted={() => { setActiveLesson(null); load() }}
          showToast={showToast}
        />
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

function LessonRow({ lesson, video, onOpen }: { lesson: ResetLesson; video: VideoRow | null; onOpen: () => void }) {
  const isUploaded = !!video
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
      style={{
        background: 'rgba(17,17,19,0.8)',
        border: isUploaded ? '1px solid rgba(255,255,255,0.07)' : '1px dashed rgba(255,255,255,0.12)',
      }}
    >
      <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-xs font-mono"
        style={isUploaded
          ? { background: 'rgba(255,255,255,0.03)', color: '#5a5a66', border: '1px solid rgba(255,255,255,0.06)' }
          : { background: 'rgba(201,168,76,0.06)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.18)' }}
      >
        {String(lesson.number).padStart(2, '0')}
      </div>

      {isUploaded && (video.thumbnail_url || video.mux_playback_id) ? (
        <div className="w-12 h-8 rounded-lg overflow-hidden shrink-0 bg-[rgba(255,255,255,0.04)]">
          <Image src={video.thumbnail_url || muxThumbnailUrl(video.mux_playback_id!)} alt="" width={48} height={32} className="w-full h-full object-cover" />
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{lesson.title}</p>
        <p className="text-[#5a5a66] text-[11px] mt-0.5">{lesson.presenter}</p>
      </div>

      {isUploaded ? (
        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={video.status} processing={video.processing_status} />
          <Edit2 size={13} className="text-[#5a5a66]" />
        </div>
      ) : (
        <span className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <Upload size={11} /> Upload
        </span>
      )}
    </button>
  )
}

function StatusPill({ status, processing }: { status: string; processing: string | null }) {
  if (processing && processing !== 'none' && processing !== 'ready') {
    return <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-blue-400"><Loader2 size={9} className="animate-spin" /> Processing</span>
  }
  const map: Record<string, string> = {
    published: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    scheduled: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    draft: 'text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',
  }
  return <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${map[status] ?? map.draft}`}>{status}</span>
}

// Minimal upload panel scoped to one lesson slot — title, presenter, stage,
// course and lesson order are all fixed by the slot, so there's nothing to
// pick, only a file to drop and a publish state to choose.
function LessonPanel({
  module, lesson, video, onClose, onSaved, onDeleted, showToast,
}: {
  module: ModuleRow; lesson: ResetLesson; video: VideoRow | null
  onClose: () => void; onSaved: () => void; onDeleted: () => void
  showToast: (msg: string) => void
}) {
  const [status, setStatus] = useState(video?.status ?? 'draft')
  const [uploadState, setUploadState] = useState<UploadState>(video?.mux_playback_id ? 'ready' : 'idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [muxAssetId, setMuxAssetId] = useState<string | null>(video?.mux_asset_id ?? null)
  const [muxPlaybackId, setMuxPlaybackId] = useState<string | null>(video?.mux_playback_id ?? null)
  const [dragOver, setDragOver] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const startPolling = useCallback((uid: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/admin/mux?uploadId=${uid}`)
      if (!res.ok) return
      const { upload, asset } = await res.json()
      if (asset?.status === 'ready') {
        clearInterval(pollRef.current!)
        setMuxAssetId(asset.id)
        setMuxPlaybackId(asset.playback_ids?.[0]?.id)
        setUploadState('ready')
      } else if (asset?.status === 'errored' || upload?.status === 'errored') {
        clearInterval(pollRef.current!)
        setUploadState('error')
      }
    }, 4000)
  }, [])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) { showToast('Please upload a video file'); return }
    setUploadState('uploading')
    setUploadProgress(0)
    setMuxAssetId(null)
    setMuxPlaybackId(null)

    const res = await fetch('/api/admin/mux', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corsOrigin: window.location.origin }),
    })
    const data = await res.json()
    if (!res.ok || !data.uploadUrl) { setUploadState('error'); showToast(data.error || 'Upload failed to start'); return }
    const { uploadId: uid, uploadUrl } = data
    setUploadId(uid)

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = e => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)) }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) { setUploadState('processing'); setUploadProgress(100); resolve() }
        else { setUploadState('error'); showToast(`Upload failed — HTTP ${xhr.status}`); reject() }
      }
      xhr.onerror = () => { setUploadState('error'); showToast('Network error during upload'); reject() }
      xhr.open('PUT', uploadUrl)
      xhr.send(file)
    })

    startPolling(uid)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const autoSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const close = async () => {
    // Same orphan-cleanup rule as the main Videos panel — an uploaded-but-unsaved
    // Mux asset must not be silently left behind on the account's quota.
    if (uploadId && !video) {
      const assetIdToDelete = muxAssetId
      if (assetIdToDelete) {
        fetch('/api/admin/mux', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ muxAssetId: assetIdToDelete }) }).catch(() => {})
      }
    }
    onClose()
  }

  const handleSave = async () => {
    if (!muxPlaybackId && !video?.mux_playback_id) { showToast('Add a video file first'); return }
    setSaving(true)
    const body = {
      title: lesson.title,
      slug: autoSlug(lesson.title),
      analyst_name: lesson.presenter,
      category: lesson.stage,
      module_id: module.id,
      sort_order: lesson.number,
      access_level: module.access_level,
      status,
      mux_asset_id: muxAssetId,
      mux_playback_id: muxPlaybackId,
      mux_upload_id: uploadId,
      processing_status: uploadState === 'ready' ? 'ready' : uploadState === 'processing' ? 'preparing' : uploadState === 'error' ? 'errored' : (video?.processing_status ?? 'none'),
      thumbnail_url: muxPlaybackId ? muxThumbnailUrl(muxPlaybackId) : (video?.thumbnail_url ?? null),
    }
    const res = video
      ? await fetch('/api/admin/videos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: video.id, updates: body }) })
      : await fetch('/api/admin/videos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Save failed'); return }
    showToast(video ? 'Lesson updated' : 'Lesson uploaded')
    onSaved()
  }

  const handleDelete = async () => {
    if (!video) return
    if (!confirm(`Remove Lesson ${lesson.number}? This deletes the uploaded video.`)) return
    setDeleting(true)
    const res = await fetch('/api/admin/mux', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: video.id, muxAssetId: video.mux_asset_id }) })
    setDeleting(false)
    if (!res.ok) { showToast('Delete failed'); return }
    showToast('Lesson removed')
    onDeleted()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div className="relative z-10 ml-auto w-full max-w-md h-full overflow-y-auto flex flex-col"
        style={{ background: 'rgba(10,10,11,0.98)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] sticky top-0 z-10" style={{ background: 'rgba(10,10,11,0.98)' }}>
          <div>
            <p className="text-[#c9a84c] text-[10px] font-semibold uppercase tracking-widest">Lesson {lesson.number} · {lesson.stage}</p>
            <h2 className="text-white font-medium text-sm mt-0.5">{lesson.title}</h2>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all shrink-0 ml-3">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          <p className="text-[#5a5a66] text-xs">
            Presenter <span className="text-[#8e8e9a]">{lesson.presenter}</span> · Course <span className="text-[#8e8e9a]">{module.title}</span> — everything here is fixed by the syllabus.
          </p>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-2">Video File</label>

            {uploadState === 'idle' && (
              <div
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className="relative flex flex-col items-center justify-center gap-3 py-10 rounded-2xl cursor-pointer transition-all"
                style={{ border: `2px dashed ${dragOver ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.1)'}`, background: dragOver ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)' }}
              >
                <Upload size={22} className="text-[#5a5a66]" />
                <div className="text-center">
                  <p className="text-white text-sm font-medium">Drop video here</p>
                  <p className="text-[#5a5a66] text-xs mt-1">or click to browse · MP4, MOV, MKV</p>
                </div>
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
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
                  <p className="text-[#5a5a66] text-xs mt-0.5">Usually ready in 1–2 minutes. You can save now.</p>
                </div>
              </div>
            )}

            {uploadState === 'ready' && muxPlaybackId && (
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-emerald-400 text-sm font-medium">Video ready</p>
                </div>
                <button onClick={() => { setUploadState('idle'); setMuxAssetId(null); setMuxPlaybackId(null); setUploadId(null) }}
                  className="text-[#5a5a66] hover:text-white transition-colors text-xs">Replace</button>
              </div>
            )}

            {uploadState === 'error' && (
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <div className="flex-1"><p className="text-red-400 text-sm font-medium">Upload failed</p></div>
                <button onClick={() => setUploadState('idle')} className="text-[#5a5a66] hover:text-white transition-colors text-xs">Retry</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Publish</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-dark w-full text-sm">
              <option value="draft">Draft — not visible to members</option>
              <option value="published">Published — live now</option>
            </select>
          </div>

          {video && (
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-2 text-xs text-[#5a5a66] hover:text-red-400 transition-colors disabled:opacity-50">
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Remove this lesson&apos;s video
            </button>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] sticky bottom-0" style={{ background: 'rgba(10,10,11,0.98)' }}>
          <button onClick={handleSave} disabled={saving || uploadState === 'uploading' || (!muxPlaybackId && !video?.mux_playback_id)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {video ? 'Save Changes' : 'Save Lesson'}
          </button>
        </div>
      </div>
    </div>
  )
}
