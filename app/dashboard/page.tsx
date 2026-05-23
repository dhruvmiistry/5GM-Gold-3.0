'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import StatCard from '@/components/StatCard'
import { mockDashboardStats, mockFreeVideos, mockLiveSessions, mockAnnouncements } from '@/lib/mockData'
import { formatDate, formatDuration } from '@/lib/utils'
import { Play, Lock, Bell, ArrowRight, TrendingUp, Calendar } from 'lucide-react'
import Badge from '@/components/Badge'

export default function DashboardPage() {
  const { user } = useAuth()
  const latestVideos = mockFreeVideos.slice(0, 3)
  const latestAnnouncement = mockAnnouncements.find(a => a.isNew)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-white mb-1">
            {greeting}, <span className="text-[#c9a84c]">{user?.name?.split(' ')[0] ?? 'Trader'}</span>.
          </h1>
          <p className="text-[#5a5a66] text-sm">This week inside 5GM Gold — three new free briefings available.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
          <span className="text-[#c9a84c] text-xs font-medium">Free Member</span>
          <span className="text-[#5a5a66] text-xs">· Gold coming soon</span>
        </div>
      </div>

      {/* Announcement banner */}
      {latestAnnouncement && (
        <Link
          href="/dashboard/announcements"
          className="flex items-start gap-3 p-4 rounded-xl bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.15)] hover:border-[rgba(201,168,76,0.25)] transition-all group"
        >
          <Bell size={16} className="text-[#c9a84c] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[#c9a84c] text-xs font-medium mr-2">{latestAnnouncement.title}</span>
            <span className="text-[#5a5a66] text-xs line-clamp-1">{latestAnnouncement.body}</span>
          </div>
          <ArrowRight size={14} className="text-[#5a5a66] shrink-0 group-hover:text-[#c9a84c] transition-colors" />
        </Link>
      )}

      {/* Stats */}
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

      {/* Latest Free Briefings */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-medium text-lg">Latest Free Briefings</h2>
            <p className="text-[#5a5a66] text-xs mt-0.5">New content this week from the full team</p>
          </div>
          <Link href="/dashboard/free-briefings" className="text-xs text-[#c9a84c] hover:text-[#e8c96d] transition-colors flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {latestVideos.map(video => (
            <Link
              key={video.id}
              href="/dashboard/free-briefings"
              className="group p-4 rounded-xl card card-gold hover:border-[rgba(201,168,76,0.2)] transition-all"
            >
              {/* Mock thumbnail */}
              <div className="aspect-video bg-[rgba(201,168,76,0.03)] rounded-lg border border-[rgba(255,255,255,0.05)] flex items-center justify-center mb-4 relative">
                <div className="w-10 h-10 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center group-hover:bg-[rgba(201,168,76,0.15)] transition-all">
                  <Play size={16} className="text-[#c9a84c] ml-0.5" />
                </div>
                <span className="absolute bottom-2 right-2 text-[10px] text-[#5a5a66] font-mono">{formatDuration(video.duration)}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="gold">{video.category}</Badge>
              </div>
              <p className="text-white text-sm font-medium leading-snug group-hover:text-[#e8c96d] transition-colors line-clamp-2 mb-1">
                {video.title}
              </p>
              <p className="text-[#5a5a66] text-xs">{video.trader} · {formatDate(video.releaseDate)}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Live Sessions */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-medium text-lg flex items-center gap-2">
              <Calendar size={16} className="text-[#c9a84c]" />
              Upcoming Live Sessions
            </h2>
            <Link href="/dashboard/live-sessions" className="text-xs text-[#5a5a66] hover:text-[#c9a84c] transition-colors">View all</Link>
          </div>
          <div className="space-y-3">
            {mockLiveSessions.slice(0, 2).map(session => (
              <div key={session.id} className="relative p-4 rounded-xl card overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0">
                    <Lock size={13} className="text-[#5a5a66]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#5a5a66] text-sm font-medium line-clamp-1 blur-[2px] select-none">{session.title}</p>
                    <p className="text-[#5a5a66] text-xs mt-0.5 blur-[2px] select-none">{session.date} · {session.time}</p>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-[#c9a84c] bg-[rgba(10,10,11,0.7)] px-3 py-1.5 rounded-full border border-[rgba(201,168,76,0.2)]">Gold Access Required</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gold preview */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-medium text-lg flex items-center gap-2">
              <TrendingUp size={16} className="text-[#c9a84c]" />
              Gold Premium
            </h2>
          </div>
          <div className="p-6 rounded-xl bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.15)] text-center">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#c9a84c] font-bold text-lg">G</span>
            </div>
            <h3 className="text-white font-medium text-base mb-2">Gold Access Coming Soon</h3>
            <p className="text-[#5a5a66] text-sm leading-relaxed mb-5">
              Weekly Outlooks, Live Sessions, 8 course modules, Strategy Vault, and 1-to-1 mentorship. All in one place.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {['Weekly Outlooks', 'Live Sessions', 'Modules', 'Strategy Vault', 'Mentorship'].map(f => (
                <span key={f} className="px-2.5 py-1 rounded-full bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.12)] text-[#8e8e9a]">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
