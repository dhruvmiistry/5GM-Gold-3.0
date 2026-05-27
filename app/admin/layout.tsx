'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Menu, ShieldCheck } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0a0a0b] overflow-hidden">
      <AdminSidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-[52px] flex items-center justify-between px-5 sticky top-0 z-30 shrink-0"
          style={{
            background: 'rgba(10,10,11,0.82)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.055)',
          }}
        >
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#8e8e9a] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
            <Menu size={17} />
          </button>

          <div className="hidden lg:flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#c9a84c]" />
            <span className="text-[#c9a84c] text-xs font-semibold tracking-wide">Admin Portal</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="w-7 h-7 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.25)] flex items-center justify-center">
              <span className="text-[#c9a84c] text-[10px] font-bold">{user?.name?.[0]?.toUpperCase() ?? 'A'}</span>
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-white text-xs font-medium">{user?.name ?? 'Admin'}</p>
              <p className="text-[#c9a84c] text-[10px]">Admin</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
