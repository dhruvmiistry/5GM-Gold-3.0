'use client'

import { useState } from 'react'
import DashboardSidebar from '@/components/DashboardSidebar'
import DashboardTopbar from '@/components/DashboardTopbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#0a0a0b] overflow-hidden">
      <DashboardSidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardTopbar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
