'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { Menu, Bell, ChevronDown, LogOut, Settings, User, ShieldCheck } from 'lucide-react'

interface DashboardTopbarProps {
  onMenuToggle?: () => void
  title?: string
}

export default function DashboardTopbar({ onMenuToggle, title }: DashboardTopbarProps) {
  const { user, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  return (
    <header
      className="h-[52px] flex items-center justify-between px-5 sticky top-0 z-30"
      style={{
        background: 'rgba(10,10,11,0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8e9a] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"
        >
          <Menu size={17} />
        </button>
        {title && (
          <h1 className="text-white font-medium text-sm hidden sm:block tracking-tight">{title}</h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">

        {/* Bell */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8e9a] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
          <Bell size={15} strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(v => !v)}
            className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-[rgba(255,255,255,0.055)] transition-all group"
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.25)] flex items-center justify-center shrink-0 group-hover:border-[rgba(201,168,76,0.4)] transition-all">
              <span className="text-[#c9a84c] text-[10px] font-bold tracking-wide">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>

            {/* Name */}
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-white text-xs font-medium">{user?.name ?? 'Trader'}</p>
              <p className="text-[10px]" style={{ color: user?.role === 'admin' ? '#c9a84c' : user?.plan === 'gold' ? '#c9a84c' : '#5a5a66' }}>
                {user?.role === 'admin' ? 'Admin' : user?.plan === 'gold' ? 'Gold Member' : 'Free Member'}
              </p>
            </div>

            <ChevronDown
              size={12}
              strokeWidth={2}
              className={`text-[#5a5a66] transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50"
                style={{
                  background: 'rgba(15,15,17,0.98)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(24px)',
                }}
              >
                {/* Profile info */}
                <div className="px-4 py-3.5 border-b border-[rgba(255,255,255,0.07)]">
                  <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-[#5a5a66] text-xs truncate mt-0.5">{user?.email}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(201,168,76,0.09)] border border-[rgba(201,168,76,0.2)]">
                    <span className="w-1 h-1 rounded-full bg-[#c9a84c]" />
                    <span className="text-[10px] text-[#c9a84c] font-semibold tracking-wide">
                      {user?.role === 'admin' ? 'Admin' : user?.plan === 'gold' ? 'Gold Member' : 'Free Member'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-1.5">
                  {[
                    ...(user?.role === 'admin' ? [{ href: '/admin', icon: ShieldCheck, label: 'Admin Portal' }] : []),
                    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
                    { href: '/', icon: User, label: 'Public Site' },
                  ].map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#8e8e9a] hover:text-white hover:bg-[rgba(255,255,255,0.05)] text-sm transition-all"
                    >
                      <item.icon size={13} strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  ))}

                  <div className="my-1 h-px bg-[rgba(255,255,255,0.06)]" />

                  <button
                    onClick={() => { setUserMenuOpen(false); logout() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[rgba(232,87,87,0.8)] hover:text-[#e85757] hover:bg-[rgba(232,87,87,0.07)] text-sm transition-all"
                  >
                    <LogOut size={13} strokeWidth={1.75} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
