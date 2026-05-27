'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Play, BookOpen, Radio, ArrowRight, TrendingUp, UserPlus, Bell, Calendar } from 'lucide-react'

interface Stats {
  totalUsers: number
  freeUsers: number
  goldUsers: number
  newSignups: number
  totalVideos: number
  totalModules: number
  upcomingSessions: { id: string; title: string; host_name: string; session_time: string }[]
  recentUsers: { id: string; full_name: string; email: string; plan: string; role: string; created_at: string }[]
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users, sub: `${stats.newSignups ?? 0} this week`, href: '/admin/users' },
    { label: 'Free Members', value: stats.freeUsers ?? 0, icon: UserPlus, sub: 'On free plan', href: '/admin/users?plan=free' },
    { label: 'Gold Members', value: stats.goldUsers ?? 0, icon: TrendingUp, sub: 'On gold plan', href: '/admin/users?plan=gold' },
    { label: 'Total Videos', value: stats.totalVideos ?? 0, icon: Play, sub: `${stats.totalModules ?? 0} modules`, href: '/admin/videos' },
  ] : []

  const quickActions = [
    { label: 'Add Video', href: '/admin/videos?create=true', icon: Play },
    { label: 'Create Announcement', href: '/admin/announcements?create=true', icon: Bell },
    { label: 'Schedule Session', href: '/admin/live-sessions?create=true', icon: Radio },
    { label: 'Add Module', href: '/admin/modules?create=true', icon: BookOpen },
    { label: 'View Calendar', href: '/admin/calendar', icon: Calendar },
    { label: 'Manage Users', href: '/admin/users', icon: Users },
  ]

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-8">

        {/* Header */}
        <div>
          <p className="section-label mb-1.5">Admin</p>
          <h1 className="text-2xl font-light text-white tracking-tight">Platform Overview</h1>
          <p className="text-[#5a5a66] text-sm mt-1">Manage all platform content, users, and settings.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-5 animate-pulse"
                style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.07)', height: 100 }} />
            ))
          ) : statCards.map(card => (
            <Link key={card.label} href={card.href}
              className="group rounded-2xl p-5 transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.22)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                  <card.icon size={14} className="text-[#c9a84c]" />
                </div>
                <ArrowRight size={12} className="text-[#3a3a46] group-hover:text-[#c9a84c] transition-colors" />
              </div>
              <div className="text-2xl font-semibold text-white mb-0.5">{card.value}</div>
              <div className="text-[#5a5a66] text-xs">{card.label}</div>
              <div className="text-[#3a3a46] text-[10px] mt-0.5">{card.sub}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div>
            <h2 className="text-white font-medium text-sm mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {quickActions.map(action => (
                <Link key={action.label} href={action.href}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.18)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}>
                    <action.icon size={13} className="text-[#c9a84c]" />
                  </div>
                  <span className="text-[#8e8e9a] text-sm group-hover:text-white transition-colors">{action.label}</span>
                  <ArrowRight size={11} className="ml-auto text-[#3a3a46] group-hover:text-[#c9a84c] transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium text-sm">Upcoming Sessions</h2>
              <Link href="/admin/live-sessions" className="text-[10px] text-[#5a5a66] hover:text-[#c9a84c] transition-colors">View all →</Link>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="text-[#5a5a66] text-sm">Loading...</div>
              ) : stats?.upcomingSessions?.length ? stats.upcomingSessions.map(s => (
                <div key={s.id} className="p-3 rounded-xl"
                  style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-white text-xs font-medium truncate">{s.title}</p>
                  <p className="text-[#5a5a66] text-[10px] mt-0.5">{s.host_name} · {new Date(s.session_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              )) : (
                <div className="p-4 rounded-xl text-center"
                  style={{ background: 'rgba(17,17,19,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-[#5a5a66] text-xs">No upcoming sessions</p>
                  <Link href="/admin/live-sessions?create=true" className="text-[#c9a84c] text-xs mt-1 block hover:underline">Schedule one →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent signups */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium text-sm">Recent Signups</h2>
              <Link href="/admin/users" className="text-[10px] text-[#5a5a66] hover:text-[#c9a84c] transition-colors">View all →</Link>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="text-[#5a5a66] text-sm">Loading...</div>
              ) : stats?.recentUsers?.map(u => (
                <Link key={u.id} href={`/admin/users/${u.id}`}
                  className="group flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                    <span className="text-[#c9a84c] text-[10px] font-bold">{(u.full_name || u.email || 'U')[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{u.full_name || u.email}</p>
                    <p className="text-[#5a5a66] text-[10px]">{new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize ${u.plan === 'gold' ? 'text-[#c9a84c] bg-[rgba(201,168,76,0.1)]' : 'text-[#5a5a66] bg-[rgba(255,255,255,0.04)]'}`}>
                    {u.role === 'admin' ? 'admin' : u.plan}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
