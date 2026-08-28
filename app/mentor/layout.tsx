'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, RotateCcw } from 'lucide-react'

// Mirrors app/admin/layout.tsx's client-side role-check pattern, scoped to
// role==='mentor' (admins can also reach mentor tools for support/testing).
export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) router.push('/login')
    else if (user.role !== 'mentor' && user.role !== 'admin') router.push('/dashboard')
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080809' }}>
        <div className="w-5 h-5 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user || (user.role !== 'mentor' && user.role !== 'admin')) return null

  return (
    <div className="min-h-screen" style={{ background: '#080809' }}>
      <header className="h-12 flex items-center gap-3 px-5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,8,9,0.95)' }}>
        <Link href="/mentor" className="flex items-center gap-2 text-[#c9a84c] text-xs font-semibold uppercase tracking-widest">
          <RotateCcw size={13} /> Mentor Portal
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[#8e8e9a] text-[11px]">{user.name?.split(' ')[0]}</span>
          <button onClick={logout}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-[#e85757] hover:bg-[rgba(232,87,87,0.08)] transition-all"
            title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
