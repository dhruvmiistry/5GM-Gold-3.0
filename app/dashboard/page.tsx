'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { getFreeVideos, getAnnouncements, getResetModule, getResetProgress, type ResetModuleData } from '@/lib/data'
import { formatDate, formatDuration } from '@/lib/utils'
import { useCountdown } from '@/lib/hooks'
import { Play, Bell, ArrowRight, Lock, RotateCcw, CheckCircle2 } from 'lucide-react'
import Badge from '@/components/Badge'
import type { Video, Announcement } from '@/lib/mockData'

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
  const [videos, setVideos] = useState<Video[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [resetModule, setResetModule] = useState<ResetModuleData | null>(null)
  const [resetProgress, setResetProgress] = useState({ percentage: 0, completedVideoIds: [] as string[] })
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    getFreeVideos().then(setVideos)
    getAnnouncements().then(setAnnouncements)
    getResetModule().then(setResetModule)
  }, [])

  useEffect(() => {
    if (user?.id && resetModule?.id) {
      getResetProgress(user.id, resetModule.id).then(setResetProgress)
    }
  }, [user?.id, resetModule?.id])

  // Set greeting on client only to avoid SSR/client hydration mismatch (timezone differs)
  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')
  }, [])

  const latestVideos = videos.slice(0, 3)
  const latestAnnouncement = announcements.find(a => a.isNew) ?? announcements[0]

  const completedCount = resetModule
    ? resetModule.lessons.filter(l => resetProgress.completedVideoIds.includes(l.id)).length
    : 0

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 md:py-12 space-y-10">

        {/* ── Welcome ──────────────────────────────────────── */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <p className="section-label mb-2">Overview</p>
            <h1 className="text-[1.9rem] font-light text-white tracking-tight leading-snug">
              {greeting},{' '}
              <span style={{ color: '#c9a84c' }}>{user?.name?.split(' ')[0] ?? 'Trader'}</span>.
            </h1>
          </motion.div>
        </motion.div>

        {/* ── The Reset — primary entry point ─────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
          <ResetHeroCard module={resetModule} completedCount={completedCount} />
        </motion.div>

        {/* ── Announcement banner ───────────────────────────── */}
        {latestAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          >
            <Link
              href="/dashboard/announcements"
              className="group flex items-center gap-4 px-5 py-4 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                transition: 'background 0.2s ease',
              }}
            >
              <Bell size={14} className="text-[#5a5a66] shrink-0" strokeWidth={1.75} />
              <div className="flex-1 min-w-0">
                <span className="text-[#8e8e9a] text-xs font-semibold mr-2">{latestAnnouncement.title}</span>
                <span className="text-[#5a5a66] text-xs line-clamp-1">{latestAnnouncement.body}</span>
              </div>
              <ArrowRight size={13} className="text-[#5a5a66] shrink-0 group-hover:text-[#c9a84c] group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </motion.div>
        )}

        {/* ── Free Videos — secondary, supplementary content ─ */}
        {latestVideos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          >
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="section-label mb-1.5">Supplementary</p>
                <h2 className="text-white font-medium text-base tracking-tight">Free Videos</h2>
                <p className="text-[#5a5a66] text-xs mt-1">Extra analyst insight alongside The Reset.</p>
              </div>
              <Link href="/dashboard/free-videos"
                className="flex items-center gap-1.5 text-xs text-[#8e8e9a] hover:text-white transition-colors font-medium"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestVideos.map((video, i) => (
                <motion.div key={video.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                >
                  <VideoCard video={video} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}

function ResetHeroCard({ module, completedCount }: { module: ResetModuleData | null; completedCount: number }) {
  const lessonCount = module?.lessons.length ?? 0
  const hasContent = lessonCount > 0
  const isComplete = hasContent && completedCount === lessonCount
  const hasStarted = hasContent && completedCount > 0 && !isComplete
  const pct = hasContent ? Math.round((completedCount / lessonCount) * 100) : 0

  const heading = isComplete ? "You've completed The Reset" : hasStarted ? 'Continue The Reset' : 'Start The Reset'
  const cta = isComplete ? 'Review lessons' : hasStarted ? 'Continue' : 'Start The Reset'

  const subtext = !hasContent
    ? 'A free, structured beginner course from the 5GM mentors — lessons are being uploaded now.'
    : hasStarted
    ? `${completedCount} of ${lessonCount} lessons complete. Pick up where you left off.`
    : isComplete
    ? 'You’ve worked through every lesson. Revisit any of them, any time.'
    : `${lessonCount} structured lesson${lessonCount === 1 ? '' : 's'} from the 5GM mentors, free — start from lesson one.`

  return (
    <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
      style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.16)' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 15% 0%, rgba(201,168,76,0.07) 0%, transparent 60%)' }} />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)' }}
        >
          <RotateCcw size={20} className="text-black" strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest mb-1.5">The Reset · Free Course</p>
          <h2 className="text-white text-xl sm:text-2xl font-medium tracking-tight mb-1.5">{heading}</h2>
          <p className="text-[#8e8e9a] text-sm leading-relaxed max-w-xl">{subtext}</p>

          {hasContent && (hasStarted || isComplete) && (
            <div className="mt-4 max-w-xs">
              <div className="h-1 bg-[rgba(255,255,255,0.07)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#c9a84c' }} />
              </div>
            </div>
          )}
        </div>

        <Link
          href="/dashboard/the-reset"
          className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all shrink-0"
        >
          {isComplete && <CheckCircle2 size={15} />}
          {cta}
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}

function VideoCard({ video }: { video: Video }) {
  const releaseTime = new Date(video.releaseDate).getTime()
  const [isPending] = useState(() => releaseTime > Date.now())
  if (isPending) return <PendingVideoCard video={video} releaseTime={releaseTime} />
  return <UnlockedVideoCard video={video} />
}

function PendingVideoCard({ video, releaseTime }: { video: Video; releaseTime: number }) {
  const remaining = useCountdown(releaseTime)
  if (remaining <= 0) return <UnlockedVideoCard video={video} />

  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')

  const releaseLabel = new Date(releaseTime).toLocaleString('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit',
    day: 'numeric', month: 'short',
  })

  return (
    <div className="relative flex flex-col rounded-2xl overflow-hidden h-full"
      style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(201,168,76,0.18)' }}
    >
      <div className="aspect-video relative overflow-hidden">
        {video.thumbnail && (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'blur(9px) brightness(0.4) saturate(0.7)', transform: 'scale(1.12)' }}
          />
        )}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, rgba(10,10,11,0.35) 0%, rgba(10,10,11,0.88) 100%)' }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-3 text-center">
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(201,168,76,0.35)', '0 0 0 10px rgba(201,168,76,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.14)', border: '1px solid rgba(201,168,76,0.4)' }}
          >
            <Lock size={16} className="text-[#e8c96d]" strokeWidth={2} />
          </motion.div>

          <div className="font-mono text-[15px] font-semibold tracking-wider" style={{ color: '#e8c96d' }}>
            {days > 0 ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[#8e8e9a]">
            Unlocks {releaseLabel} UK
          </p>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2.5">
          <Badge variant="gold">{video.category}</Badge>
        </div>
        <p className="text-white text-sm font-medium leading-snug line-clamp-2 flex-1">
          {video.title}
        </p>
        <p className="text-[#5a5a66] text-[11px] mt-2.5">{video.trader}</p>
      </div>
    </div>
  )
}

function UnlockedVideoCard({ video }: { video: Video }) {
  return (
    <Link href="/dashboard/free-videos"
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
        {video.thumbnail && (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {!video.thumbnail && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 gap-px opacity-15">
            {Array.from({ length: 30 }).map((_, j) => (
              <div key={j} className="bg-[#c9a84c] rounded-full"
                style={{ width: '2px', height: `${12 + Math.sin(j * 0.7) * 18 + (j % 3) * 7}%` }} />
            ))}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
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
  )
}
