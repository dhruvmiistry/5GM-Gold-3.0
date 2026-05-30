'use client'

import { motion } from 'framer-motion'
import { Play, Clock } from 'lucide-react'
import { DbVideo } from '@/lib/types'
import { formatDuration, formatDate } from '@/lib/utils'
import Badge from './Badge'

interface VideoCardProps {
  video: DbVideo
  onPlay: (video: DbVideo) => void
}

const categoryColor: Record<string, 'gold' | 'green' | 'muted'> = {
  'Weekly Outlook': 'gold',
  'Market Breakdown': 'muted',
  'Psychology': 'green',
  'Risk Management': 'muted',
}

export default function VideoCard({ video, onPlay }: VideoCardProps) {
  const thumbnailSrc = video.mux_playback_id
    ? `https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=640&height=360&time=5`
    : null

  const initials = (video.analyst_name ?? 'A')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <motion.div
      className="group cursor-pointer rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(17,17,19,0.9)',
        border: '1px solid rgba(255,255,255,0.07)',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
      }}
      onClick={() => onPlay(video)}
      whileHover={{
        y: -3,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 28px rgba(201,168,76,0.08)',
        transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#0d0d0f] overflow-hidden">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at 65% 25%, rgba(201,168,76,0.05) 0%, transparent 65%)' }}
            />
            <div className="absolute inset-0 flex items-end justify-center pb-4 gap-px opacity-[0.18] group-hover:opacity-30 transition-opacity duration-500">
              {Array.from({ length: 44 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[#c9a84c] rounded-full"
                  style={{ width: '2.5px', height: `${14 + Math.sin(i * 0.55) * 22 + (i % 4) * 5}%` }}
                />
              ))}
            </div>
          </>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}
        />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.3)',
            }}
          >
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
              style={{ background: 'rgba(201,168,76,0.18)', boxShadow: '0 0 20px rgba(201,168,76,0.2)' }}
            />
            <Play size={17} className="text-[#c9a84c] ml-0.5 relative z-10" strokeWidth={2} />
          </div>
        </div>

        {/* Duration pill */}
        {video.duration != null && (
          <div
            className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono"
            style={{ background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.6)' }}
          >
            <Clock size={9} strokeWidth={2} />
            {formatDuration(video.duration)}
          </div>
        )}

        <div
          className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }}
        />
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          {video.category && (
            <Badge variant={categoryColor[video.category] || 'muted'}>
              {video.category}
            </Badge>
          )}
          {video.release_date && (
            <span className="text-[#5a5a66] text-[11px]">{formatDate(video.release_date)}</span>
          )}
        </div>

        <h3 className="text-white text-sm font-medium leading-snug mb-2 group-hover:text-[#e8c96d] transition-colors duration-200 line-clamp-2">
          {video.title}
        </h3>

        {video.description && (
          <p className="text-[#5a5a66] text-xs leading-relaxed mb-4 line-clamp-2">
            {video.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center pt-3 border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[rgba(201,168,76,0.09)] border border-[rgba(201,168,76,0.18)] flex items-center justify-center">
              <span className="text-[#c9a84c] text-[8px] font-bold">{initials}</span>
            </div>
            <span className="text-[#5a5a66] text-[11px]">{video.analyst_name ?? 'Analyst'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
