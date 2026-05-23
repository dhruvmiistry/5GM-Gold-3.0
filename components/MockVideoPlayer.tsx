'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, SkipBack, SkipForward, Volume2, Maximize, Clock } from 'lucide-react'
import { Video } from '@/lib/mockData'
import { formatDuration, formatDate } from '@/lib/utils'
import Badge from './Badge'

interface MockVideoPlayerProps {
  video: Video
  onClose: () => void
}

const categoryColor: Record<string, 'gold' | 'muted' | 'green'> = {
  'Weekly Outlook': 'gold',
  'Market Breakdown': 'muted',
  'Psychology': 'green',
  'Risk Management': 'muted',
}

export default function MockVideoPlayer({ video, onClose }: MockVideoPlayerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

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
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        />

        {/* Player */}
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
          {/* Video area */}
          <div className="relative bg-[#0a0a0b] aspect-video flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, #0a0a0b 70%)' }}
            />

            {/* Waveform */}
            <div className="absolute inset-0 flex items-end justify-center pb-14 gap-0.5 opacity-[0.09]">
              {Array.from({ length: 80 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[#c9a84c] w-1 rounded-full"
                  style={{ height: `${10 + Math.sin(i * 0.4) * 20 + (i % 5) * 4}%` }}
                />
              ))}
            </div>

            {/* Play button */}
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
                style={{
                  background: 'rgba(201,168,76,0.12)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  boxShadow: '0 0 32px rgba(201,168,76,0.15)',
                }}
              >
                <Play size={28} className="text-[#c9a84c] ml-1" strokeWidth={2} />
              </div>
              <p className="text-[#5a5a66] text-sm">Preview Mode</p>
            </div>

            {/* Duration */}
            <div
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#8e8e9a] text-xs font-mono"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            >
              <Clock size={11} strokeWidth={1.75} />
              {formatDuration(video.duration)}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8e9a] hover:text-white transition-all duration-200 hover:bg-[rgba(255,255,255,0.1)]"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
            >
              <X size={15} strokeWidth={2} />
            </button>

            {/* Progress bar + controls */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="h-0.5 bg-[rgba(255,255,255,0.08)]">
                <div className="h-full w-0 bg-[#c9a84c] rounded-full" />
              </div>
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
              >
                <div className="flex items-center gap-3.5">
                  <button className="text-[#8e8e9a] hover:text-white transition-colors">
                    <SkipBack size={15} strokeWidth={1.75} />
                  </button>
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{ background: '#c9a84c' }}
                  >
                    <Play size={13} className="text-black ml-0.5" strokeWidth={2.5} />
                  </button>
                  <button className="text-[#8e8e9a] hover:text-white transition-colors">
                    <SkipForward size={15} strokeWidth={1.75} />
                  </button>
                  <span className="text-[#5a5a66] text-xs font-mono ml-1">0:00 / {formatDuration(video.duration)}</span>
                </div>
                <div className="flex items-center gap-3.5">
                  <Volume2 size={15} className="text-[#8e8e9a]" strokeWidth={1.75} />
                  <Maximize size={13} className="text-[#8e8e9a]" strokeWidth={1.75} />
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div
            className="p-6"
            style={{ background: 'rgba(15,15,17,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={categoryColor[video.category] || 'muted'}>
                    {video.category}
                  </Badge>
                  <span className="text-[#3a3a42] text-xs font-mono">{formatDate(video.releaseDate)}</span>
                </div>
                <h2 className="text-white font-semibold text-lg mb-2 leading-tight">{video.title}</h2>
                <p className="text-[#8e8e9a] text-sm leading-relaxed">{video.description}</p>
              </div>
            </div>

            <div
              className="flex items-center justify-between mt-5 pt-5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.22)' }}
                >
                  <span className="text-[#c9a84c] text-[10px] font-bold">
                    {video.trader.split(' ').map(w => w[0]).join('')}
                  </span>
                </div>
                <span className="text-[#8e8e9a] text-sm">{video.trader}</span>
              </div>
              <span className="text-[#3a3a42] text-xs font-mono">{video.views.toLocaleString()} views</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
