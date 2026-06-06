'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import Link from 'next/link'
import { Menu, ChevronRight, LogOut } from 'lucide-react'

const pageLabels: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/videos': 'Videos',
  '/admin/modules': 'Modules',
  '/admin/live-sessions': 'Live Sessions',
  '/admin/resources': 'Resources',
  '/admin/announcements': 'Announcements',
  '/admin/users': 'Users',
  '/admin/calendar': 'Calendar',
  '/admin/settings': 'Settings',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') router.push('/dashboard')
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080809' }}>
        <div className="w-5 h-5 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
      </div>
    )
  }

  const currentLabel = Object.entries(pageLabels).find(([key]) =>
    key === '/admin' ? pathname === '/admin' : pathname.startsWith(key)
  )?.[1] ?? 'Admin'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080809' }}>
      <AdminSidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-12 flex items-center gap-3 px-5 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,8,9,0.95)' }}>

          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white transition-colors">
            <Menu size={16} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs">
            <Link href="/admin" className="text-[#3a3a46] hover:text-[#5a5a66] transition-colors font-medium">Admin</Link>
            {currentLabel !== 'Overview' && (
              <>
                <ChevronRight size={11} className="text-[#3a3a46]" />
                <span className="text-[#8e8e9a] font-medium">{currentLabel}</span>
              </>
            )}
          </div>

          {/* User pill + sign out */}
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}>
              <div className="w-4 h-4 rounded-full bg-[rgba(201,168,76,0.2)] flex items-center justify-center">
                <span className="text-[#c9a84c] text-[8px] font-bold">{user?.name?.[0]?.toUpperCase() ?? 'A'}</span>
              </div>
              <span className="text-[#c9a84c] text-[11px] font-medium">{user?.name?.split(' ')[0] ?? 'Admin'}</span>
            </div>
            <button
              onClick={logout}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-[#e85757] hover:bg-[rgba(232,87,87,0.08)] transition-all"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
