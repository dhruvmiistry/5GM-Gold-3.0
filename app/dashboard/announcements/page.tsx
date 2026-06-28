'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Megaphone, Settings, Star, Heart } from 'lucide-react'
import { getAnnouncements } from '@/lib/data'
import type { Announcement } from '@/lib/mockData'
import { formatDate } from '@/lib/utils'
import Badge from '@/components/Badge'

const typeConfig: Record<string, { icon: React.ElementType; label: string; variant: 'gold' | 'green' | 'muted' | 'new' }> = {
  content: { icon: Bell, label: 'New Content', variant: 'green' },
  platform: { icon: Star, label: 'Platform', variant: 'gold' },
  update: { icon: Settings, label: 'Update', variant: 'muted' },
  welcome: { icon: Heart, label: 'Welcome', variant: 'new' },
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  useEffect(() => { getAnnouncements().then(setAnnouncements) }, [])

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-8 md:py-10 space-y-8">

        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <p className="section-label mb-2">Updates</p>
            <h1 className="text-[1.7rem] font-light text-white tracking-tight leading-snug mb-2">
              Announcements
            </h1>
            <p className="text-[#5a5a66] text-sm">Platform updates, new content alerts, and team messages.</p>
          </motion.div>
        </motion.div>

        {/* Feed */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {announcements.map(announcement => {
            const config = typeConfig[announcement.type]
            const Icon = config?.icon ?? Megaphone
            return (
              <motion.div
                key={announcement.id}
                variants={fadeUp}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(17,17,19,0.85)',
                  border: announcement.isNew
                    ? '1px solid rgba(201,168,76,0.18)'
                    : '1px solid rgba(255,255,255,0.06)',
                  borderLeft: announcement.isNew ? '3px solid rgba(201,168,76,0.4)' : undefined,
                }}
              >
                <div className="flex items-start gap-4 p-5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={
                      announcement.isNew
                        ? { background: 'rgba(201,168,76,0.09)', border: '1px solid rgba(201,168,76,0.22)' }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
                    }
                  >
                    <Icon
                      size={14}
                      strokeWidth={1.75}
                      className={announcement.isNew ? 'text-[#c9a84c]' : 'text-[#5a5a66]'}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-white font-medium text-sm">{announcement.title}</h3>
                      {announcement.isNew && <Badge variant="new">New</Badge>}
                      {config && <Badge variant={config.variant}>{config.label}</Badge>}
                    </div>
                    <p className="text-[#8e8e9a] text-sm leading-relaxed mb-3">
                      {announcement.body}
                    </p>
                    <span className="text-[#3a3a42] text-xs font-mono">{formatDate(announcement.date)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

      </div>
    </div>
  )
}
