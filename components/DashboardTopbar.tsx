'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Menu, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'

interface DashboardTopbarProps {
  onMenuToggle?: () => void
  title?: string
}

export default function DashboardTopbar({ onMenuToggle, title }: DashboardTopbarProps) {
  const { user, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="h-14 border-b border-[rgba(255,255,255,0.06)] bg-[#0d0d0f]/80 backdrop-blur-md flex items-center justify-between px-5 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-[#8e8e9a] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all"
        >
          <Menu size={18} />
        </button>

        {title && (
          <h1 className="text-white font-medium text-sm hidden sm:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-[#8e8e9a] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center">
              <span className="text-[#c9a84c] text-[10px] font-semibold">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-white text-xs font-medium leading-none">{user?.name ?? 'Trader'}</p>
              <p className="text-[#5a5a66] text-[10px] leading-none mt-0.5">Free Member</p>
            </div>
            <ChevronDown size={13} className="text-[#5a5a66]" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#111113] border border-[rgba(255,255,255,0.08)] shadow-xl shadow-black/50 overflow-hidden z-50">
              <div className="p-3 border-b border-[rgba(255,255,255,0.06)]">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-[#5a5a66] text-xs truncate">{user?.email}</p>
                <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-[rgba(201,168,76,0.08)] text-[#c9a84c] border border-[rgba(201,168,76,0.2)]">
                  Free Member
                </span>
              </div>
              <div className="p-1.5">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#8e8e9a] hover:text-white hover:bg-[rgba(255,255,255,0.04)] text-sm transition-all"
                >
                  <Settings size={14} />
                  Settings
                </Link>
                <Link
                  href="/"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#8e8e9a] hover:text-white hover:bg-[rgba(255,255,255,0.04)] text-sm transition-all"
                >
                  <User size={14} />
                  Public Site
                </Link>
                <button
                  onClick={() => { setUserMenuOpen(false); logout() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#e85757] hover:bg-[rgba(232,87,87,0.06)] text-sm transition-all"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
