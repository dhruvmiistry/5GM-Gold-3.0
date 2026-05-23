'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  locked: boolean
  badge?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, locked: false },
  { label: 'Free Briefings', href: '/dashboard/free-briefings', icon: Play, locked: false, badge: 'New' },
  { label: 'Weekly Outlooks', href: '/dashboard/weekly-outlooks', icon: TrendingUp, locked: true },
  { label: 'Live Sessions', href: '/dashboard/live-sessions', icon: Radio, locked: true },
  { label: 'Gold Modules', href: '/dashboard/gold-modules', icon: BookOpen, locked: true },
  { label: 'Strategy Vault', href: '/dashboard/strategy-vault', icon: Shield, locked: true },
  { label: 'Market Breakdowns', href: '/dashboard/market-breakdowns', icon: BarChart2, locked: false },
  { label: 'Revision Material', href: '/dashboard/revision-material', icon: BookMarked, locked: true },
  { label: 'Announcements', href: '/dashboard/announcements', icon: Bell, locked: false, badge: '2' },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, locked: false },
]

interface DashboardSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function DashboardSidebar({ mobileOpen = false, onMobileClose }: DashboardSidebarProps) {
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[rgba(201,168,76,0.12)] border border-[rgba(201,168,76,0.25)] flex items-center justify-center">
              <span className="text-[#c9a84c] font-bold text-xs">5G</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-semibold text-sm">5GM</span>
              <span className="text-[#c9a84c] text-[9px] tracking-[0.15em] uppercase">Gold</span>
            </div>
          </Link>
          {onMobileClose && (
            <button onClick={onMobileClose} className="lg:hidden text-[#5a5a66] hover:text-white">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {/* Free section */}
        <div className="mb-1">
          <p className="text-[#5a5a66] text-[10px] font-semibold uppercase tracking-wider px-3 py-2">Free Access</p>
          {navItems.filter(i => !i.locked).map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={16} />
                <span className="flex-1">{item.label}</span>
                {item.badge && !isActive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(201,168,76,0.12)] text-[#c9a84c] font-medium">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight size={12} className="opacity-40" />}
              </Link>
            )
          })}
        </div>

        {/* Gold section */}
        <div className="pt-2">
          <p className="text-[#5a5a66] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 flex items-center gap-2">
            <span>Gold Access</span>
            <span className="w-1 h-1 rounded-full bg-[#c9a84c] pulse-glow" />
          </p>
          {navItems.filter(i => i.locked).map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className="sidebar-link locked-nav"
            >
              <item.icon size={16} />
              <span className="flex-1">{item.label}</span>
              <Lock size={11} className="text-[#5a5a66]" />
            </Link>
          ))}
        </div>
      </nav>

      {/* Gold status */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
        <div className="p-3 rounded-xl bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.12)]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
            <span className="text-[#c9a84c] text-[11px] font-semibold tracking-wide">Gold Access</span>
          </div>
          <p className="text-[#5a5a66] text-[11px] leading-relaxed">
            Premium access is coming soon. Free briefings are available now.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#0d0d0f] border-r border-[rgba(255,255,255,0.06)] h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="relative z-10 flex flex-col w-64 bg-[#0d0d0f] border-r border-[rgba(255,255,255,0.06)] h-full">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
