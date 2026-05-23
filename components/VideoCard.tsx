'use client'

import { Play, Clock, Eye } from 'lucide-react'
import { Video } from '@/lib/mockData'
import { formatDuration, formatDate } from '@/lib/utils'
import Badge from './Badge'

interface VideoCardProps {
  video: Video
  onPlay: (video: Video) => void
}

const categoryColor: Record<string, 'gold' | 'green' | 'muted'> = {
  'Weekly Outlook': 'gold',
  'Market Breakdown': 'muted',
  'Psychology': 'green',
  'Risk Management': 'muted',
}

export default function VideoCard({ video, onPlay }: VideoCardProps) {
  return (
    <div
      className="group cursor-pointer card card-gold overflow-hidden hover:border-[rgba(201,168,76,0.2)] transition-all"
      onClick={() => onPlay(video)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#0d0d0f] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(ellipse at 70% 30%, rgba(201,168,76,0.06) 0%, transparent 70%)',
          }}
        />
        {/* Waveform decoration */}
        <div className="absolute inset-0 flex items-end justify-center pb-3 gap-px opacity-15">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#c9a84c] w-1 rounded-full"
              style={{ height: `${15 + Math.sin(i * 0.6) * 20 + (i % 3) * 8}%` }}
            />
          ))}
        </div>

        {/* Play button */}
        <div className="relative z-10 w-12 h-12 rounded-full bg-[rgba(201,168,76,0.12)] border border-[rgba(201,168,76,0.25)] flex items-center justify-center group-hover:bg-[rgba(201,168,76,0.2)] group-hover:scale-105 transition-all">
          <Play size={18} className="text-[#c9a84c] ml-0.5" />
        </div>

        {/* Duration */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md bg-[rgba(0,0,0,0.6)] text-[#8e8e9a] text-[11px]">
          <Clock size={10} />
          {formatDuration(video.duration)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Badge variant={categoryColor[video.category] || 'muted'}>
            {video.category}
          </Badge>
          <span className="text-[#5a5a66] text-xs">{formatDate(video.releaseDate)}</span>
        </div>

        <h3 className="text-white font-medium text-sm leading-snug mb-2 group-hover:text-[#e8c96d] transition-colors line-clamp-2">
          {video.title}
        </h3>

        <p className="text-[#5a5a66] text-xs leading-relaxed mb-4 line-clamp-2">
          {video.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)] flex items-center justify-center">
              <span className="text-[#c9a84c] text-[8px] font-semibold">{video.trader.split(' ').map(w => w[0]).join('')}</span>
            </div>
            <span className="text-[#5a5a66] text-xs">{video.trader}</span>
          </div>
          <div className="flex items-center gap-1 text-[#5a5a66] text-xs">
            <Eye size={11} />
            {video.views.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}
