'use client'

import { useEffect } from 'react'
import { X, Play, SkipBack, SkipForward, Volume2, Maximize, Clock } from 'lucide-react'
import { Video } from '@/lib/mockData'
import { formatDuration, formatDate } from '@/lib/utils'
import Badge from './Badge'

interface MockVideoPlayerProps {
  video: Video
  onClose: () => void
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

  const categoryColor: Record<string, string> = {
    'Weekly Outlook': 'gold',
    'Market Breakdown': 'muted',
    'Psychology': 'green',
    'Risk Management': 'muted',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Player */}
      <div className="relative z-10 w-full max-w-4xl rounded-2xl overflow-hidden card border-[rgba(255,255,255,0.1)]">
        {/* Video area */}
        <div className="relative bg-[#0a0a0b] aspect-video flex items-center justify-center">
          {/* Mock video background */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.04) 0%, #0a0a0b 70%)',
            }}
          />

          {/* Fake waveform */}
          <div className="absolute inset-0 flex items-end justify-center pb-12 gap-0.5 opacity-10">
            {Array.from({ length: 80 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#c9a84c] w-1 rounded-full"
                style={{ height: `${10 + Math.sin(i * 0.4) * 20 + Math.random() * 20}%` }}
              />
            ))}
          </div>

          {/* Play button */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[rgba(201,168,76,0.12)] border border-[rgba(201,168,76,0.3)] flex items-center justify-center cursor-pointer hover:bg-[rgba(201,168,76,0.2)] transition-all gold-glow">
              <Play size={28} className="text-[#c9a84c] ml-1" />
            </div>
            <p className="text-[#8e8e9a] text-sm">Click to play — Preview Mode</p>
          </div>

          {/* Duration badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-[#8e8e9a] text-xs">
            <Clock size={12} />
            {formatDuration(video.duration)}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-lg glass flex items-center justify-center text-[#8e8e9a] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          {/* Fake progress bar */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-0.5 bg-[rgba(255,255,255,0.1)]">
              <div className="h-full w-0 bg-[#c9a84c] rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-t from-[rgba(0,0,0,0.6)] to-transparent">
              <div className="flex items-center gap-3">
                <button className="text-[#8e8e9a] hover:text-white transition-colors"><SkipBack size={16} /></button>
                <button className="w-8 h-8 rounded-full bg-[#c9a84c] flex items-center justify-center hover:bg-[#e8c96d] transition-colors">
                  <Play size={14} className="text-black ml-0.5" />
                </button>
                <button className="text-[#8e8e9a] hover:text-white transition-colors"><SkipForward size={16} /></button>
                <span className="text-[#5a5a66] text-xs ml-2">0:00 / {formatDuration(video.duration)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Volume2 size={16} className="text-[#8e8e9a]" />
                <Maximize size={14} className="text-[#8e8e9a]" />
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 bg-[#111113]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={(categoryColor[video.category] || 'muted') as 'gold' | 'muted' | 'green'}>
                  {video.category}
                </Badge>
                <span className="text-[#5a5a66] text-xs">{formatDate(video.releaseDate)}</span>
              </div>
              <h2 className="text-white font-semibold text-lg mb-2 leading-tight">{video.title}</h2>
              <p className="text-[#8e8e9a] text-sm leading-relaxed">{video.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5 pt-5 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center">
                <span className="text-[#c9a84c] text-[10px] font-semibold">{video.trader.split(' ').map(w => w[0]).join('')}</span>
              </div>
              <span className="text-[#8e8e9a] text-sm">{video.trader}</span>
            </div>
            <span className="text-[#5a5a66] text-xs">{video.views.toLocaleString()} views</span>
          </div>
        </div>
      </div>
    </div>
  )
}
