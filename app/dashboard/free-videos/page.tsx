'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DbVideo } from '@/lib/types'
import VideoCard from '@/components/VideoCard'
import MuxPlayer from '@/components/MuxPlayer'
import { usePostVideoInvitation } from '@/components/mentorCalls/usePostVideoInvitation'
import { Sparkles, X, Loader2 } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export default function FreeVideosPage() {
  const [videos, setVideos] = useState<DbVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [playingVideo, setPlayingVideo] = useState<DbVideo | null>(null)
  const { dialog: invitationDialog, onVideoEnded, resetGuard } = usePostVideoInvitation()

  const playVideo = (video: DbVideo) => { resetGuard(); setPlayingVideo(video) }

  useEffect(() => {
    fetch('/api/videos/free')
      .then(r => r.json())
      .then(data => { setVideos(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const categories = ['All', ...Array.from(new Set(videos.map(v => v.category).filter(Boolean) as string[]))]

  const filtered = activeCategory === 'All'
    ? videos
    : videos.filter(v => v.category === activeCategory)

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-10 space-y-8">

        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <p className="section-label mb-2">Free Access</p>
            <h1 className="text-[1.7rem] font-light text-white tracking-tight leading-snug mb-2">
              Free Videos
            </h1>
            <p className="text-[#5a5a66] text-sm">
              New content drops every week from the full team.
            </p>
          </motion.div>
        </motion.div>

        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="flex items-center gap-4 px-5 py-4 rounded-2xl"
          style={{
            background: 'rgba(201,168,76,0.04)',
            border: '1px solid rgba(201,168,76,0.14)',
            borderLeft: '3px solid rgba(201,168,76,0.45)',
          }}
        >
          <Sparkles size={14} className="text-[#c9a84c] shrink-0" strokeWidth={1.75} />
          <p className="text-sm">
            <span className="text-[#c9a84c] font-medium">Free access — </span>
            <span className="text-[#8e8e9a]">All videos below are available to watch instantly.</span>
          </p>
          <span className="ml-auto text-[#3a3a42] text-xs font-mono shrink-0">
            {loading ? '—' : filtered.length} video{filtered.length !== 1 ? 's' : ''}
          </span>
        </motion.div>

        {/* Category filter */}
        {!loading && categories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            className="flex flex-wrap gap-2"
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                style={
                  activeCategory === cat
                    ? { background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', boxShadow: '0 0 12px rgba(201,168,76,0.08)' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#8e8e9a' }
                }
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}

        {/* Video grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={22} className="text-[#c9a84c] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[#5a5a66] text-sm">No videos available yet.</p>
            <p className="text-[#3a3a46] text-xs mt-1">Check back soon — new content drops every week.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filtered.map((video, i) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                >
                  <VideoCard video={video} onPlay={playVideo} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Mux player modal */}
      <AnimatePresence>
        {playingVideo && playingVideo.mux_playback_id && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => setPlayingVideo(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-4xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-medium text-sm leading-snug">{playingVideo.title}</p>
                  {playingVideo.analyst_name && (
                    <p className="text-[#5a5a66] text-xs mt-0.5">{playingVideo.analyst_name}</p>
                  )}
                </div>
                <button
                  onClick={() => setPlayingVideo(null)}
                  className="ml-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-all shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <MuxPlayer
                playbackId={playingVideo.mux_playback_id}
                title={playingVideo.title}
                onEnded={() => { onVideoEnded(playingVideo.id); setPlayingVideo(null) }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {invitationDialog}
    </div>
  )
}
