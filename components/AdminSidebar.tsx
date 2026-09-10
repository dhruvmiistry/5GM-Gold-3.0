'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Play, Bell,
  Radio, FileText, Calendar, Settings,
  ArrowLeft, X, ShieldCheck, BookOpen, RotateCcw,
  ClipboardList, Shield,
} from 'lucide-react'

const sections = [
  {
    label: 'Content',
    items: [
      { label: 'The Reset',     href: '/admin/the-reset',     icon: RotateCcw },
      { label: 'Videos',        href: '/admin/videos',        icon: Play },
      { label: 'Modules',       href: '/admin/modules',       icon: BookOpen },
      { label: 'Live Sessions', href: '/admin/live-sessions', icon: Radio },
      { label: 'Resources',     href: '/admin/resources',     icon: FileText },
      { label: 'Announcements', href: '/admin/announcements', icon: Bell },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Users',    href: '/admin/users',    icon: Users },
      { label: 'Calendar', href: '/admin/calendar', icon: Calendar },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
]

const goldDeskItems = [
  { label: 'Applications',    href: '/admin/applications',       icon: ClipboardList },
  { label: 'Funnel Settings', href: '/admin/gold-desk/settings', icon: Shield },
]

interface AdminSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const SidebarContent = () => (
    <div className="flex flex-col h-full relative">

      {/* Ambient gold glow — same light-source language as the marketing hero */}
      <div className="absolute -top-16 -left-10 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      {/* Header */}
      <div className="relative px-4 py-5 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">
              <Image src="/logo.png" alt="5GM Gold" width={72} height={24} className="h-5 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={10} className="text-[#c9a84c]" />
              <span className="text-[#c9a84c] text-[10px] font-semibold tracking-[0.15em] uppercase">Admin Portal</span>
            </div>
          </div>
          {onMobileClose && (
            <button onClick={onMobileClose}
              className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white transition-colors">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Overview link */}
      <div className="relative px-3 pt-4 pb-2">
        <Link
          href="/admin"
          onClick={onMobileClose}
          className={`sidebar-link ${pathname === '/admin' ? 'active' : ''}`}
        >
          <LayoutDashboard size={14} strokeWidth={pathname === '/admin' ? 2 : 1.75} />
          <span className="font-medium flex-1">Overview</span>
        </Link>
      </div>

      {/* Sections */}
      <nav className="relative flex-1 px-3 pb-4 space-y-5 overflow-y-auto">

        {/* Gold Desk — glowing highlight card, distinct from the plain sections below */}
        <div className="relative overflow-hidden rounded-xl p-2.5"
          style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.16)' }}>
          <div className="absolute inset-0 shimmer pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-1.5 px-1 pb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#c9a84c]">Gold Desk</p>
            </div>
            <div className="space-y-0.5">
              {goldDeskItems.map(item => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                  >
                    <item.icon size={14} strokeWidth={active ? 2 : 1.75} />
                    <span className="font-medium flex-1">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {sections.map(section => (
          <div key={section.label}>
            <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#3a3a46]">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                  >
                    <item.icon size={14} strokeWidth={active ? 2 : 1.75} />
                    <span className="font-medium flex-1">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="relative px-3 pb-4 pt-3 border-t border-[rgba(255,255,255,0.05)]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[#3a3a46] hover:text-[#5a5a66] hover:bg-[rgba(255,255,255,0.03)] transition-all"
        >
          <ArrowLeft size={13} strokeWidth={1.75} />
          <span className="font-medium">Member Dashboard</span>
        </Link>
      </div>
    </div>
  )

  return (
    <>
      <aside
        className="hidden lg:flex flex-col w-[210px] shrink-0 h-screen sticky top-0 overflow-hidden"
        style={{ background: 'rgba(8,8,9,1)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="relative z-10 flex flex-col w-[210px] h-full overflow-hidden"
            style={{ background: 'rgba(8,8,9,1)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
