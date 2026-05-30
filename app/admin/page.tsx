'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Play, BookOpen, Radio, Bell, Calendar, FileText, TrendingUp, UserPlus, ArrowUpRight } from 'lucide-react'

interface Stats {
  totalUsers: number; freeUsers: number; goldUsers: number; newSignups: number
  totalVideos: number; totalModules: number
  upcomingSessions: { id: string; title: string; host_name: string; session_time: string }[]
  recentUsers: { id: string; full_name: string; email: string; plan: string; role: string; created_at: string }[]
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Total Members', value: stats.totalUsers, sub: `+${stats.newSignups} this week`, icon: Users, href: '/admin/users', color: '#c9a84c' },
    { label: 'Free Members', value: stats.freeUsers, sub: 'On free plan', icon: UserPlus, href: '/admin/users?plan=free', color: '#8e8e9a' },
    { label: 'Gold Members', value: stats.goldUsers, sub: 'Full access', icon: TrendingUp, href: '/admin/users?plan=gold', color: '#c9a84c' },
    { label: 'Videos', value: stats.totalVideos, sub: `${stats.totalModules} modules`, icon: Play, href: '/admin/videos', color: '#8e8e9a' },
  ] : []

  const actions = [
    { label: 'Upload Video', href: '/admin/videos', icon: Play, desc: 'Add new content' },
    { label: 'Announce', href: '/admin/announcements', icon: Bell, desc: 'Send to members' },
    { label: 'Schedule Session', href: '/admin/live-sessions', icon: Radio, desc: 'Live trading room' },
    { label: 'Add Module', href: '/admin/modules', icon: BookOpen, desc: 'Course content' },
    { label: 'Add Resource', href: '/admin/resources', icon: FileText, desc: 'Files & materials' },
    { label: 'Calendar', href: '/admin/calendar', icon: Calendar, desc: 'Upcoming schedule' },
  ]

  return (
    <div className="min-h-full px-6 md:px-8 py-8 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">Platform Overview</h1>
        <p className="text-[#5a5a66] text-sm mt-1">Everything at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))
        ) : statCards.map(card => (
          <Link key={card.label} href={card.href}
            className="group relative p-5 rounded-2xl transition-all hover:-translate-y-px overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <card.icon size={13} style={{ color: card.color }} strokeWidth={1.75} />
              <ArrowUpRight size={11} className="text-[#3a3a46] group-hover:text-[#c9a84c] transition-colors" />
            </div>
            <div className="text-[2rem] font-semibold text-white leading-none mb-1.5">{card.value ?? 0}</div>
            <div className="text-[#5a5a66] text-xs font-medium">{card.label}</div>
            <div className="text-[#3a3a46] text-[10px] mt-0.5">{card.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Quick Actions */}
        <div className="lg:col-span-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3a3a46] mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {actions.map(a => (
              <Link key={a.label} href={a.href}
                className="group flex flex-col gap-3 p-4 rounded-xl transition-all hover:-translate-y-px"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.12)' }}>
                  <a.icon size={13} className="text-[#c9a84c]" />
                </div>
                <div>
                  <p className="text-white text-xs font-medium">{a.label}</p>
                  <p className="text-[#3a3a46] text-[10px] mt-0.5">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent Signups */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3a3a46]">Recent Signups</p>
              <Link href="/admin/users" className="text-[10px] text-[#5a5a66] hover:text-[#c9a84c] transition-colors">View all →</Link>
            </div>
            <div className="space-y-1.5">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
                ))
              ) : stats?.recentUsers?.length ? stats.recentUsers.slice(0, 5).map(u => (
                <Link key={u.id} href={`/admin/users/${u.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.12)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)' }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.12)' }}>
                    <span className="text-[#c9a84c] text-[9px] font-bold">{(u.full_name || u.email || 'U')[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{u.full_name || u.email}</p>
                    <p className="text-[#3a3a46] text-[10px]">{new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${u.plan === 'gold' ? 'text-[#c9a84c]' : 'text-[#3a3a46]'}`}>
                    {u.role === 'admin' ? 'admin' : u.plan}
                  </span>
                </Link>
              )) : (
                <p className="text-[#3a3a46] text-xs px-3 py-4">No signups yet</p>
              )}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3a3a46]">Upcoming Sessions</p>
              <Link href="/admin/live-sessions" className="text-[10px] text-[#5a5a66] hover:text-[#c9a84c] transition-colors">View all →</Link>
            </div>
            <div className="space-y-1.5">
              {loading ? (
                <div className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
              ) : stats?.upcomingSessions?.length ? stats.upcomingSessions.map(s => (
                <div key={s.id} className="px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-white text-xs font-medium truncate">{s.title}</p>
                  <p className="text-[#3a3a46] text-[10px] mt-0.5">{s.host_name} · {new Date(s.session_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              )) : (
                <div className="px-3 py-4">
                  <p className="text-[#3a3a46] text-xs">No upcoming sessions</p>
                  <Link href="/admin/live-sessions" className="text-[#c9a84c] text-[10px] mt-1 block hover:underline">Schedule one →</Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
