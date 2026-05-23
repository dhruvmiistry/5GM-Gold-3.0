'use client'

import { useState } from 'react'
import { mockMarketBreakdowns, Video } from '@/lib/mockData'
import VideoCard from '@/components/VideoCard'
import MockVideoPlayer from '@/components/MockVideoPlayer'
import LockedCard from '@/components/LockedCard'
import { formatDuration, formatDate } from '@/lib/utils'
import { Play, Lock } from 'lucide-react'
import Badge from '@/components/Badge'

export default function MarketBreakdownsPage() {
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null)

  const freeVideos = mockMarketBreakdowns.filter(v => v.free)
  const lockedVideos = mockMarketBreakdowns.filter(v => !v.free)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-white mb-2">Market Breakdowns</h1>
        <p className="text-[#5a5a66] text-sm max-w-lg">
          Instrument-specific analysis from the full team. Some breakdowns are free, premium analysis is available to Gold members.
        </p>
      </div>

      {/* Free content */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4caf7d]" />
          <h2 className="text-white font-medium">Free Breakdowns</h2>
          <span className="text-[#5a5a66] text-xs">({freeVideos.length} available)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {freeVideos.map(video => (
            <VideoCard key={video.id} video={video} onPlay={setPlayingVideo} />
          ))}
        </div>
      </div>

      {/* Premium locked content */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Lock size={13} className="text-[#c9a84c]" />
          <h2 className="text-white font-medium">Premium Breakdowns</h2>
          <span className="text-[#5a5a66] text-xs">(Gold access required)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lockedVideos.map(video => (
            <div key={video.id} className="relative rounded-2xl card overflow-hidden">
              <div className="locked-blur">
                <div className="aspect-video bg-[rgba(201,168,76,0.02)] flex items-center justify-center">
                  <Play size={20} className="text-[rgba(201,168,76,0.2)]" />
                </div>
                <div className="p-4">
                  <Badge variant="gold">{video.category}</Badge>
                  <p className="text-[#5a5a66] text-sm font-medium mt-2">{video.title}</p>
                  <p className="text-[#5a5a66] text-xs mt-1">{video.trader} · {formatDate(video.releaseDate)}</p>
                  <p className="text-[#5a5a66] text-xs mt-1">{formatDuration(video.duration)}</p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(10,10,11,0.55)] backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.25)] flex items-center justify-center">
                    <Lock size={14} className="text-[#c9a84c]" />
                  </div>
                  <span className="text-xs text-[#c9a84c] font-medium">Gold Access</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {playingVideo && <MockVideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}
    </div>
  )
}
