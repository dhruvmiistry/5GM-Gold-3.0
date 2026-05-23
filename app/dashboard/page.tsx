'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import StatCard from '@/components/StatCard'
import { mockDashboardStats, mockFreeVideos, mockLiveSessions, mockAnnouncements } from '@/lib/mockData'
import { formatDate, formatDuration } from '@/lib/utils'
import { Play, Lock, Bell, ArrowRight, TrendingUp, Calendar, Sparkles } from 'lucide-react'
import Badge from '@/components/Badge'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const latestVideos = mockFreeVideos.slice(0, 3)
  const latestAnnouncement = mockAnnouncements.find(a => a.isNew)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-10 space-y-10">

        {/* ── Welcome ──────────────────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <motion.div variants={fadeUp}>
            <p className="section-label mb-2">Overview</p>
            <h1 className="text-[1.7rem] font-light text-white tracking-tight leading-snug">
              {greeting},{' '}
              <span style={{ color: '#c9a84c' }}>{user?.name?.split(' ')[0] ?? 'Trader'}</span>.
            </h1>
            <p className="text-[#5a5a66] text-sm mt-1.5">
              This week inside 5GM Gold — three new free briefings available.
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{
                background: 'rgba(201,168,76,0.06)',
                border: '1px solid rgba(201,168,76,0.16)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
              <span className="text-[#c9a84c] text-xs font-semibold">Free Member</span>
              <span className="text-[#5a5a66] text-xs">· Gold coming soon</span>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Announcement banner ───────────────────────────── */}
        {latestAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          >
            <Link
              href="/dashboard/announcements"
              className="group flex items-center gap-4 px-5 py-4 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(201,168,76,0.05)',
                border: '1px solid rgba(201,168,76,0.16)',
                borderLeft: '3px solid rgba(201,168,76,0.5)',
                transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
            >
              <Bell size={15} className="text-[#c9a84c] shrink-0" strokeWidth={1.75} />
              <div className="flex-1 min-w-0">
                <span className="text-[#c9a84c] text-xs font-semibold mr-2">{latestAnnouncement.title}</span>
                <span className="text-[#5a5a66] text-xs line-clamp-1">{latestAnnouncement.body}</span>
              </div>
              <ArrowRight
                size={14}
                className="text-[#5a5a66] shrink-0 group-hover:text-[#c9a84c] group-hover:translate-x-0.5 transition-all duration-200"
              />
            </Link>
          </motion.div>
        )}

        {/* ── Stats ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mockDashboardStats.map((stat, i) => (
            <StatCard
              key={stat.label}
              {...stat}
              locked={stat.change.toLowerCase().includes('gold')}
              index={i}
            />
          ))}
        </div>

        {/* ── Latest Briefings ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="section-label mb-1.5">This week</p>
              <h2 className="text-white font-medium text-lg tracking-tight">Latest Free Briefings</h2>
            </div>
            <Link
              href="/dashboard/free-briefings"
              className="flex items-center gap-1.5 text-xs text-[#c9a84c] hover:text-[#e8c96d] transition-colors font-medium"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestVideos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
              >
                <Link
                  href="/dashboard/free-briefings"
                  className="group flex flex-col rounded-2xl overflow-hidden h-full"
                  style={{
                    background: 'rgba(17,17,19,0.85)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.borderColor = 'rgba(201,168,76,0.22)'
                    el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(201,168,76,0.06)'
                    el.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.borderColor = 'rgba(255,255,255,0.07)'
                    el.style.boxShadow = 'none'
                    el.style.transform = 'translateY(0)'
                  }}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video relative overflow-hidden"
                    style={{ background: 'radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.04) 0%, #0d0d0f 65%)' }}
                  >
                    <div className="absolute inset-0 flex items-end justify-center pb-3 gap-px opacity-15">
                      {Array.from({ length: 30 }).map((_, j) => (
                        <div
                          key={j}
                          className="bg-[#c9a84c] rounded-full"
                          style={{ width: '2px', height: `${12 + Math.sin(j * 0.7) * 18 + (j % 3) * 7}%` }}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.28)' }}
                      >
                        <Play size={15} className="text-[#c9a84c] ml-0.5" strokeWidth={2} />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2.5 text-[10px] font-mono"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      {formatDuration(video.duration)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Badge variant="gold">{video.category}</Badge>
                    </div>
                    <p className="text-white text-sm font-medium leading-snug group-hover:text-[#e8c96d] transition-colors duration-200 line-clamp-2 flex-1">
                      {video.title}
                    </p>
                    <p className="text-[#5a5a66] text-[11px] mt-2.5">
                      {video.trader} · {formatDate(video.releaseDate)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Bottom two-col ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Live Sessions */}
          <div>
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="section-label mb-1.5">Upcoming</p>
                <h2 className="text-white font-medium text-base tracking-tight flex items-center gap-2">
                  <Calendar size={15} className="text-[#c9a84c]" strokeWidth={1.75} />
                  Live Sessions
                </h2>
              </div>
              <Link href="/dashboard/live-sessions" className="text-[11px] text-[#5a5a66] hover:text-[#c9a84c] transition-colors">
                View all →
              </Link>
            </div>

            <div className="space-y-3">
              {mockLiveSessions.slice(0, 2).map(session => (
                <div
                  key={session.id}
                  className="relative rounded-xl overflow-hidden"
                  style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-start gap-3 p-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <Lock size={12} className="text-[#3a3a42]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0 select-none" style={{ filter: 'blur(3px)' }}>
                      <p className="text-[#5a5a66] text-sm font-medium truncate">{session.title}</p>
                      <p className="text-[#5a5a66] text-xs mt-0.5">{session.date} · {session.time}</p>
                    </div>
                  </div>
                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(10,10,11,0.55)', backdropFilter: 'blur(1px)' }}
                  >
                    <span
                      className="text-xs text-[#c9a84c] font-medium px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(10,10,11,0.8)', border: '1px solid rgba(201,168,76,0.22)' }}
                    >
                      Gold Access Required
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gold Preview */}
          <div>
            <div className="mb-5">
              <p className="section-label mb-1.5">Premium</p>
              <h2 className="text-white font-medium text-base tracking-tight flex items-center gap-2">
                <Sparkles size={15} className="text-[#c9a84c]" strokeWidth={1.75} />
                Gold Access
              </h2>
            </div>

            <div
              className="relative rounded-2xl p-6 overflow-hidden text-center"
              style={{
                background: 'rgba(17,17,19,0.7)',
                border: '1px solid rgba(201,168,76,0.16)',
                boxShadow: '0 0 40px rgba(201,168,76,0.04) inset',
              }}
            >
              {/* Background glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 65%)' }}
              />

              {/* Icon */}
              <div className="relative z-10">
                <div
                  className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: 'rgba(201,168,76,0.09)',
                    border: '1px solid rgba(201,168,76,0.22)',
                    boxShadow: '0 0 20px rgba(201,168,76,0.1)',
                  }}
                >
                  <span className="text-[#c9a84c] font-bold text-lg font-display">G</span>
                </div>

                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
                  <h3 className="text-white font-medium text-base">Gold Access Coming Soon</h3>
                </div>

                <p className="text-[#5a5a66] text-sm leading-relaxed mb-5 max-w-xs mx-auto">
                  Weekly Outlooks, Live Sessions, 8 course modules, Strategy Vault, and 1-to-1 mentorship.
                </p>

                <div className="flex flex-wrap justify-center gap-2">
                  {['Weekly Outlooks', 'Live Sessions', 'Modules', 'Strategy Vault', 'Mentorship'].map(f => (
                    <span
                      key={f}
                      className="text-[11px] text-[#8e8e9a] px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
