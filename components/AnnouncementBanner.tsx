'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Megaphone, X } from 'lucide-react'
import { getAnnouncements } from '@/lib/data'

const DISMISSED_KEY = '5gm_dismissed_announcement_id'

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getAnnouncements().then(list => {
      if (cancelled || list.length === 0) return
      const latest = list[0]
      if (latest.id !== localStorage.getItem(DISMISSED_KEY)) {
        setAnnouncement({ id: latest.id, title: latest.title })
      }
    })
    return () => { cancelled = true }
  }, [])

  const dismiss = () => {
    if (announcement) localStorage.setItem(DISMISSED_KEY, announcement.id)
    setAnnouncement(null)
  }

  return (
    <AnimatePresence>
      {announcement && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="overflow-hidden shrink-0"
        >
          <div
            className="flex items-center gap-3 px-5 py-2.5"
            style={{
              background: 'linear-gradient(90deg, rgba(201,168,76,0.12), rgba(201,168,76,0.05))',
              borderBottom: '1px solid rgba(201,168,76,0.18)',
            }}
          >
            <Megaphone size={14} className="text-[#c9a84c] shrink-0" strokeWidth={1.75} />
            <p className="text-xs text-[#f5f5f7] flex-1 min-w-0 truncate">
              <span className="font-semibold text-[#e8c96d]">New: </span>
              {announcement.title}
            </p>
            <Link
              href="/dashboard/announcements"
              onClick={dismiss}
              className="text-[11px] font-semibold text-[#c9a84c] hover:text-[#e8c96d] transition-colors whitespace-nowrap"
            >
              View
            </Link>
            <button
              onClick={dismiss}
              className="text-[#8e8e9a] hover:text-white transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
