'use client'

import { motion } from 'framer-motion'
import { Lock, BookOpen } from 'lucide-react'
import { mockModules } from '@/lib/mockData'
import ProgressCard from '@/components/ProgressCard'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export default function GoldModulesPage() {
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
              Gold Modules
            </h1>
            <p className="text-[#5a5a66] text-sm max-w-lg">
              Eight structured modules from foundations to funded trader execution. Built by the full team.
            </p>
          </motion.div>
        </motion.div>

        {/* Locked notice */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(17,17,19,0.7)',
            border: '1px solid rgba(201,168,76,0.18)',
            boxShadow: '0 0 40px rgba(201,168,76,0.04) inset',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 60%)' }}
          />
          <div className="relative flex items-start gap-5 p-6">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(201,168,76,0.09)', border: '1px solid rgba(201,168,76,0.22)' }}
            >
              <BookOpen size={18} className="text-[#c9a84c]" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium text-base mb-1.5">Gold access is not open yet.</h3>
              <p className="text-[#5a5a66] text-sm leading-relaxed max-w-xl mb-4">
                All eight modules are fully built and ready for Gold launch. Complete them in order, or jump to the area you need most. Every module includes video lessons, resources, and a completion certificate.
              </p>
              <div className="flex flex-wrap gap-2">
                {['8 modules', '113 lessons', '45 hours of content', 'Certificates'].map(f => (
                  <span
                    key={f}
                    className="text-xs px-2.5 py-1 rounded-full text-[#8e8e9a]"
                    style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.14)' }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Module grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
          <p className="section-label mb-5">All Modules</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockModules.map((module, i) => (
              <ProgressCard key={module.id} module={module} index={i} />
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
