'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen, Play, Bell,
  Radio, FileText, Calendar, Settings, ArrowLeft, X, ShieldCheck,
} from 'lucide-react'

const navItems = [
  { label: 'Overview',       href: '/admin',                icon: LayoutDashboard },
  { label: 'Users',          href: '/admin/users',          icon: Users },
  { label: 'Videos',         href: '/admin/videos',         icon: Play },
  { label: 'Modules',        href: '/admin/modules',        icon: BookOpen },
  { label: 'Announcements',  href: '/admin/announcements',  icon: Bell },
  { label: 'Live Sessions',  href: '/admin/live-sessions',  icon: Radio },
  { label: 'Resources',      href: '/admin/resources',      icon: FileText },
  { label: 'Calendar',       href: '/admin/calendar',       icon: Calendar },
  { label: 'Settings',       href: '/admin/settings',       icon: Settings },
]

interface AdminSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo + label */}
      <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.055)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center opacity-90 hover:opacity-100 transition-opacity">
              <Image src="/logo.png" alt="5GM Gold" width={80} height={26} className="h-6 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <ShieldCheck size={9} className="text-[#c9a84c]" />
              <span className="text-[#c9a84c] text-[9px] font-bold uppercase tracking-widest">Admin</span>
            </div>
          </div>
          {onMobileClose && (
            <button onClick={onMobileClose}
              className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="section-label px-3 pb-2">Admin Portal</p>
        {navItems.map(item => {
          const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={onMobileClose}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={15} strokeWidth={isActive ? 2 : 1.75} />
              <span className="flex-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Back to dashboard */}
      <div className="px-3 pb-4 border-t border-[rgba(255,255,255,0.055)] pt-3">
        <Link href="/dashboard"
          className="sidebar-link text-[#5a5a66] hover:text-white"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          <span className="font-medium text-sm">Member Dashboard</span>
        </Link>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 h-screen sticky top-0"
        style={{ background: 'rgba(10,10,11,0.98)', borderRight: '1px solid rgba(255,255,255,0.055)' }}>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="relative z-10 flex flex-col w-64 h-full"
            style={{ background: 'rgba(10,10,11,0.98)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
