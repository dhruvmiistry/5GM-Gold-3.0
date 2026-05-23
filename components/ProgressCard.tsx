'use client'

import { motion } from 'framer-motion'
import { Lock, BookOpen } from 'lucide-react'
import { Module } from '@/lib/mockData'

interface ProgressCardProps {
  module: Module
  index?: number
}

export default function ProgressCard({ module, index = 0 }: ProgressCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      className="group relative p-5 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(17,17,19,0.8)',
        border: '1px solid rgba(255,255,255,0.07)',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
      whileHover={{
        borderColor: module.locked ? 'rgba(201,168,76,0.18)' : 'rgba(76,175,125,0.25)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <span className="text-[#3a3a42] text-xs font-mono font-bold">
          {String(index + 1).padStart(2, '0')}
        </span>
        {module.locked ? (
          <div className="w-6 h-6 rounded-lg bg-[rgba(201,168,76,0.07)] border border-[rgba(201,168,76,0.18)] flex items-center justify-center">
            <Lock size={11} className="text-[#c9a84c]" strokeWidth={2} />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-lg bg-[rgba(76,175,125,0.08)] border border-[rgba(76,175,125,0.18)] flex items-center justify-center">
            <BookOpen size={11} className="text-[#4caf7d]" strokeWidth={2} />
          </div>
        )}
      </div>

      <h4 className="text-white font-medium text-sm mb-1.5 tracking-tight">{module.title}</h4>
      <p className="text-[#5a5a66] text-xs leading-relaxed mb-4 line-clamp-2">{module.description}</p>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[11px] text-[#5a5a66] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-md">
          {module.lessons} lessons
        </span>
        <span className="text-[11px] text-[#5a5a66] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-md">
          {module.duration}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ background: module.locked ? 'transparent' : '#c9a84c' }}
          initial={{ width: 0 }}
          animate={{ width: module.locked ? '0%' : `${module.progress}%` }}
          transition={{ duration: 0.8, delay: index * 0.06 + 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#5a5a66]">
          {module.locked ? 'Locked' : `${module.progress}% complete`}
        </span>
        {module.locked && (
          <span className="text-[9px] text-[#c9a84c] font-semibold tracking-[0.12em] uppercase">Gold</span>
        )}
      </div>
    </motion.div>
  )
}
