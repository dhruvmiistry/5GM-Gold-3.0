'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard,
  Play,
  TrendingUp,
  Radio,
  BookOpen,
  Shield,
  BarChart2,
  BookMarked,
  Bell,
  Settings,
  Lock,
  ChevronRight,
  X,
  ShieldCheck,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  locked: boolean
  badge?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard',         href: '/dashboard',                    icon: LayoutDashboard, locked: false },
  { label: 'Free Videos',       href: '/dashboard/free-videos',        icon: Play,            locked: false, badge: 'New' },
  { label: 'Weekly Outlooks',   href: '/dashboard/weekly-outlooks',    icon: TrendingUp,      locked: true },
  { label: 'Live Sessions',     href: '/dashboard/live-sessions',      icon: Radio,           locked: true },
  { label: 'Gold Modules',      href: '/dashboard/gold-modules',       icon: BookOpen,        locked: true },
  { label: 'Strategy Vault',    href: '/dashboard/strategy-vault',     icon: Shield,          locked: true },
  { label: 'Market Breakdowns', href: '/dashboard/market-breakdowns',  icon: BarChart2,       locked: true },
  { label: 'Revision Material', href: '/dashboard/revision-material',  icon: BookMarked,      locked: true },
  { label: 'Announcements',     href: '/dashboard/announcements',      icon: Bell,            locked: false, badge: '1' },
  { label: 'Settings',          href: '/dashboard/settings',           icon: Settings,        locked: false },
]

interface DashboardSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function DashboardSidebar({ mobileOpen = false, onMobileClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const hasGoldAccess = user?.plan === 'gold' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.055)]">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center opacity-90 hover:opacity-100 transition-opacity">
            <Image src="/logo.png" alt="5GM Gold" width={100} height={32} className="h-7 w-auto object-contain" />
          </Link>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        {/* Free section */}
        <div className="mb-3">
          <p className="section-label px-3 pb-2">Free Access</p>
          {navItems.filter(i => !i.locked).map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={15} strokeWidth={isActive ? 2 : 1.75} />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge && !isActive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(201,168,76,0.14)] text-[#c9a84c] font-semibold tracking-wide">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight size={11} className="text-[#c9a84c] opacity-60" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Gold section */}
        <div>
          <div className="flex items-center gap-2 px-3 pb-2">
            <p className="section-label">Gold Access</p>
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
          </div>
          {navItems.filter(i => i.locked).map(item => (
            <div key={item.href} className="sidebar-link locked-nav cursor-default">
              <item.icon size={15} strokeWidth={1.75} />
              <span className="flex-1 font-medium" style={{ filter: 'blur(5px)', userSelect: 'none' }}>
                {item.label}
              </span>
              <Lock size={10} className="text-[#5a5a66]" strokeWidth={2} />
            </div>
          ))}
        </div>

        {/* Admin Portal link */}
        {isAdmin && (
          <div className="mt-3">
            <div className="my-1 mx-3 h-px bg-[rgba(255,255,255,0.055)]" />
            <Link
              href="/admin"
              onClick={onMobileClose}
              className={`sidebar-link mt-1 ${pathname.startsWith('/admin') ? 'active' : ''}`}
            >
              <ShieldCheck size={15} strokeWidth={1.75} />
              <span className="flex-1 font-medium">Admin Portal</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Status footer */}
      <div className="px-3 pb-4 border-t border-[rgba(255,255,255,0.055)] pt-3">
        <div className="relative overflow-hidden px-3.5 py-3 rounded-xl bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.14)]">
          <div className="absolute inset-0 shimmer pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
              <span className="text-[#c9a84c] text-[11px] font-semibold tracking-wide">
                {isAdmin ? 'Admin Access' : hasGoldAccess ? 'Gold Member' : 'Gold Access'}
              </span>
            </div>
            <p className="text-[#5a5a66] text-[11px] leading-relaxed">
              {isAdmin
                ? 'Full platform access. Admin portal enabled.'
                : hasGoldAccess
                ? 'Full Gold access unlocked.'
                : 'Free videos available now. Premium access coming soon.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[232px] shrink-0 h-screen sticky top-0"
        style={{ background: 'rgba(10,10,11,0.95)', borderRight: '1px solid rgba(255,255,255,0.055)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <aside className="relative z-10 flex flex-col w-64 h-full"
            style={{ background: 'rgba(10,10,11,0.98)', borderRight: '1px solid rgba(255,255,255,0.07)' }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
