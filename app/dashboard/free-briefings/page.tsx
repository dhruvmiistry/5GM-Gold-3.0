'use client'

import { useState } from 'react'
import { mockFreeVideos, Video } from '@/lib/mockData'
import VideoCard from '@/components/VideoCard'
import MockVideoPlayer from '@/components/MockVideoPlayer'

const categories = ['All', 'Weekly Outlook', 'Market Breakdown', 'Psychology', 'Risk Management']

export default function FreeBriefingsPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null)

  const filtered = activeCategory === 'All'
    ? mockFreeVideos
    : mockFreeVideos.filter(v => v.category === activeCategory)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4caf7d]" />
          <span className="text-[#4caf7d] text-xs font-medium uppercase tracking-wider">Free Access</span>
        </div>
        <h1 className="text-2xl font-light text-white mb-2">Free Briefings</h1>
        <p className="text-[#5a5a66] text-sm">
          Three new briefings every week from the full team. New content drops every week.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              activeCategory === cat
                ? 'bg-[rgba(201,168,76,0.12)] border border-[rgba(201,168,76,0.3)] text-[#c9a84c]'
                : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-[#8e8e9a] hover:text-white hover:border-[rgba(255,255,255,0.12)]'
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="ml-auto text-[#5a5a66] text-xs self-center">{filtered.length} videos</span>
      </div>

      {/* This week banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.12)] mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow shrink-0" />
        <p className="text-[#8e8e9a] text-sm">
          <span className="text-[#c9a84c] font-medium">This week: </span>
          DXY & Gold Setup, NASDAQ Structure Shift, and Trading Psychology — all uploaded and ready to watch.
        </p>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(video => (
          <VideoCard key={video.id} video={video} onPlay={setPlayingVideo} />
        ))}
      </div>

      {/* Video player modal */}
      {playingVideo && (
        <MockVideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </div>
  )
}
