'use client'

import { motion } from 'framer-motion'
import { Lock, Radio, Calendar, Clock } from 'lucide-react'
import { mockLiveSessions } from '@/lib/mockData'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export default function LiveSessionsPage() {
  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-10 space-y-8">

        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={11} className="text-[#c9a84c]" strokeWidth={2} />
              <p className="section-label" style={{ color: '#c9a84c', opacity: 1 }}>Gold Access Required</p>
            </div>
            <h1 className="text-[1.7rem] font-light text-white tracking-tight leading-snug mb-2">
              Live Sessions
            </h1>
            <p className="text-[#5a5a66] text-sm max-w-lg">
              Live trading room sessions, mentorship rooms, and replay archives. Available to Gold members.
            </p>
          </motion.div>
        </motion.div>

        {/* Live room hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="relative rounded-2xl overflow-hidden text-center py-12 px-6"
          style={{
            background: 'rgba(17,17,19,0.7)',
            border: '1px solid rgba(201,168,76,0.18)',
            boxShadow: '0 0 60px rgba(201,168,76,0.04) inset',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%)' }}
          />
          <div className="relative z-10">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{
                background: 'rgba(201,168,76,0.09)',
                border: '1px solid rgba(201,168,76,0.22)',
                boxShadow: '0 0 24px rgba(201,168,76,0.1)',
              }}
            >
              <Radio size={22} className="text-[#c9a84c]" strokeWidth={1.75} />
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
              <h3 className="text-white font-medium text-lg">Live mentorship room coming soon.</h3>
            </div>
            <p className="text-[#5a5a66] text-sm leading-relaxed max-w-md mx-auto mb-6">
              Weekly live sessions with the full team — pre-market analysis, live trade breakdowns, and real-time Q&amp;A. Gold access required.
            </p>
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[#c9a84c] text-sm font-medium"
              style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
              Live room launching with Gold access
            </div>
          </div>
        </motion.div>

        {/* Upcoming schedule */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={14} className="text-[#c9a84c]" strokeWidth={1.75} />
            <p className="section-label" style={{ opacity: 1 }}>Upcoming Schedule</p>
          </div>
          <div className="space-y-3">
            {mockLiveSessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                className="relative rounded-xl overflow-hidden"
                style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-start gap-4 p-5 select-none" style={{ filter: 'blur(3px)' }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <Radio size={16} className="text-[#3a3a42]" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full text-[#5a5a66]"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        {session.recurring}
                      </span>
                    </div>
                    <div className="h-3 rounded-full w-2/3 mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="h-2.5 rounded-full w-1/2 mb-3" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    <div className="flex items-center gap-5 text-xs text-[#5a5a66]">
                      <span className="flex items-center gap-1.5"><Calendar size={11} strokeWidth={1.75} /><span className="h-2 rounded-full w-14 inline-block" style={{ background: 'rgba(255,255,255,0.04)' }} /></span>
                      <span className="flex items-center gap-1.5"><Clock size={11} strokeWidth={1.75} /><span className="h-2 rounded-full w-16 inline-block" style={{ background: 'rgba(255,255,255,0.04)' }} /></span>
                    </div>
                  </div>
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(10,10,11,0.55)', backdropFilter: 'blur(1px)' }}
                >
                  <span
                    className="text-xs text-[#c9a84c] font-medium px-4 py-2 rounded-full"
                    style={{ background: 'rgba(10,10,11,0.8)', border: '1px solid rgba(201,168,76,0.22)' }}
                  >
                    Gold Access Required
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Replay archive */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
          <p className="section-label mb-5">Replay Archive</p>
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="w-10 h-10 rounded-xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Lock size={16} className="text-[#3a3a42]" strokeWidth={1.75} />
            </div>
            <h3 className="text-[#5a5a66] font-medium text-sm mb-2">Session replays locked</h3>
            <p className="text-[#3a3a42] text-xs max-w-xs mx-auto">All live session recordings will be available here for Gold members to rewatch at any time.</p>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
