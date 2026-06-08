'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import MuxPlayer from '@mux/mux-player-react'
import { DbVideo } from '@/lib/types'
import Badge from './Badge'

interface MuxVideoPlayerProps {
  video: DbVideo
  onClose: () => void
}

const categoryColor: Record<string, 'gold' | 'muted' | 'green'> = {
  'Weekly Outlook': 'gold',
  'Market Breakdown': 'muted',
  'Psychology': 'green',
  'Risk Management': 'muted',
}

function formatReleaseDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MuxVideoPlayer({ video, onClose }: MuxVideoPlayerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const playbackId = video.mux_playback_id ?? ''
  const category = video.category ?? 'General'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        />

        {/* Player panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="relative z-10 w-full max-w-4xl rounded-2xl overflow-hidden"
          style={{
            background: '#0e0e10',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 40px rgba(201,168,76,0.06)',
          }}
        >
          {/* Mux player */}
          <div className="relative aspect-video bg-black">
            {playbackId ? (
              <MuxPlayer
                playbackId={playbackId}
                streamType="on-demand"
                autoPlay
                className="w-full h-full"
                metadata={{
                  video_title: video.title,
                  viewer_user_id: undefined,
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-[#5a5a66] text-sm">No video available</p>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8e9a] hover:text-white transition-all duration-200 hover:bg-[rgba(255,255,255,0.1)]"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
            >
              <X size={15} strokeWidth={2} />
            </button>
          </div>

          {/* Info bar */}
          <div
            className="p-6"
            style={{ background: 'rgba(15,15,17,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={categoryColor[category] ?? 'muted'}>{category}</Badge>
                  {video.release_date && (
                    <span className="text-[#3a3a42] text-xs font-mono">{formatReleaseDate(video.release_date)}</span>
                  )}
                  {video.duration && (
                    <span className="text-[#3a3a42] text-xs font-mono">{video.duration}</span>
                  )}
                </div>
                <h2 className="text-white font-semibold text-lg mb-2 leading-tight">{video.title}</h2>
                {video.description && (
                  <p className="text-[#8e8e9a] text-sm leading-relaxed">{video.description}</p>
                )}
              </div>
            </div>

            {video.analyst_name && (
              <div
                className="flex items-center gap-2.5 mt-5 pt-5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.22)' }}
                >
                  <span className="text-[#c9a84c] text-[10px] font-bold">
                    {video.analyst_name.split(' ').map(w => w[0]).join('')}
                  </span>
                </div>
                <span className="text-[#8e8e9a] text-sm">{video.analyst_name}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
