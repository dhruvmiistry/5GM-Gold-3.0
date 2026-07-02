'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { mockMarketBreakdowns, Video } from '@/lib/mockData'
import { DbVideo } from '@/lib/types'
import VideoCard from '@/components/VideoCard'
import { formatDuration, formatDate } from '@/lib/utils'
import { Play, Lock, X } from 'lucide-react'
import MuxPlayer from '@/components/MuxPlayer'
import Badge from '@/components/Badge'

const adaptToDb = (v: Video): DbVideo => ({
  id: v.id,
  title: v.title,
  description: v.description,
  thumbnail_url: v.thumbnail,
  duration: v.duration,
  category: v.category,
  release_date: v.releaseDate,
  created_at: v.releaseDate,
  analyst_name: v.trader,
  mux_playback_id: null,
  processing_status: 'none',
})

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export default function MarketBreakdownsPage() {
  const [playingVideo, setPlayingVideo] = useState<DbVideo | null>(null)

  const freeVideos = mockMarketBreakdowns.filter(v => v.free).map(adaptToDb)
  const lockedVideos = mockMarketBreakdowns.filter(v => !v.free)

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-10 space-y-10">

        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <p className="section-label mb-2">Analysis</p>
            <h1 className="text-[1.7rem] font-light text-white tracking-tight leading-snug mb-2">
              Market Breakdowns
            </h1>
            <p className="text-[#5a5a66] text-sm max-w-lg">
              Instrument-specific analysis from the full team. Some breakdowns are free, premium analysis is available to Gold members.
            </p>
          </motion.div>
        </motion.div>

        {/* Free content */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4caf7d]" />
            <p className="section-label" style={{ color: '#4caf7d', opacity: 1 }}>Free Breakdowns</p>
            <span className="text-[#3a3a42] text-xs font-mono">{freeVideos.length} available</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {freeVideos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
              >
                <VideoCard video={video} onPlay={setPlayingVideo} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Premium locked content */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <Lock size={11} className="text-[#c9a84c]" strokeWidth={2} />
            <p className="section-label" style={{ color: '#c9a84c', opacity: 1 }}>Premium Breakdowns</p>
            <span className="text-[#3a3a42] text-xs font-mono">Gold access required</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {lockedVideos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                className="relative rounded-2xl overflow-hidden"
                style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="select-none pointer-events-none" style={{ filter: 'blur(3px)' }}>
                  <div
                    className="aspect-video flex items-center justify-center"
                    style={{ background: 'radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.04) 0%, #0d0d0f 65%)' }}
                  >
                    <Play size={20} className="text-[rgba(201,168,76,0.2)]" />
                  </div>
                  <div className="p-4">
                    <Badge variant="gold">{video.category}</Badge>
                    <p className="text-[#5a5a66] text-sm font-medium mt-2 line-clamp-2">{video.title}</p>
                    <p className="text-[#5a5a66] text-xs mt-1.5">{video.trader} · {formatDate(video.releaseDate)}</p>
                    <p className="text-[#3a3a42] text-xs mt-0.5 font-mono">{formatDuration(video.duration)}</p>
                  </div>
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(10,10,11,0.55)', backdropFilter: 'blur(1px)' }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
                    >
                      <Lock size={13} className="text-[#c9a84c]" strokeWidth={2} />
                    </div>
                    <span className="text-xs text-[#c9a84c] font-medium">Gold Access</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Mux player modal */}
      <AnimatePresence>
        {playingVideo && (
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
              {playingVideo.mux_playback_id ? (
                <MuxPlayer playbackId={playingVideo.mux_playback_id} title={playingVideo.title} />
              ) : (
                <div
                  className="w-full aspect-video rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(17,17,19,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-[#5a5a66] text-sm">Video coming soon.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
