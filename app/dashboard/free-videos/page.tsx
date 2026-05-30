'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { mockFreeVideos, Video } from '@/lib/mockData'
import VideoCard from '@/components/VideoCard'
import MockVideoPlayer from '@/components/MockVideoPlayer'
import { Sparkles } from 'lucide-react'

const categories = ['All', 'Weekly Outlook', 'Market Breakdown', 'Psychology', 'Risk Management']

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export default function FreeBriefingsPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null)

  const filtered = activeCategory === 'All'
    ? mockFreeVideos
    : mockFreeVideos.filter(v => v.category === activeCategory)

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
              Three new videos every week from the full team. New content drops every week.
            </p>
          </motion.div>
        </motion.div>

        {/* This week banner */}
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
            <span className="text-[#c9a84c] font-medium">This week: </span>
            <span className="text-[#8e8e9a]">DXY &amp; Gold Setup, NASDAQ Structure Shift, and Trading Psychology — all uploaded and ready to watch.</span>

          </p>
          <span className="ml-auto text-[#3a3a42] text-xs font-mono shrink-0">{filtered.length} videos</span>
        </motion.div>

        {/* Category filter */}
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
                  ? {
                      background: 'rgba(201,168,76,0.12)',
                      border: '1px solid rgba(201,168,76,0.3)',
                      color: '#c9a84c',
                      boxShadow: '0 0 12px rgba(201,168,76,0.08)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: '#8e8e9a',
                    }
              }
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Video grid */}
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
                <VideoCard video={video} onPlay={setPlayingVideo} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Video player modal */}
      {playingVideo && (
        <MockVideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </div>
  )
}
