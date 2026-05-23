'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  sublabel: string
  change: string
  icon?: LucideIcon
  locked?: boolean
  index?: number
}

export default function StatCard({ label, value, sublabel, change, icon: Icon, locked = false, index = 0 }: StatCardProps) {
  const isGoldRequired = change.toLowerCase().includes('gold')

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      className="relative p-5 rounded-2xl overflow-hidden group"
      style={{
        background: 'rgba(17,17,19,0.8)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
      whileHover={{
        boxShadow: locked
          ? '0 4px 20px rgba(0,0,0,0.3)'
          : '0 4px 24px rgba(0,0,0,0.35), 0 0 20px rgba(201,168,76,0.07)',
      }}
    >
      {/* Top accent line — free cards only */}
      {!locked && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.4) 50%, transparent 100%)' }}
        />
      )}

      {/* Content */}
      <div className="flex items-start justify-between mb-4">
        <span className="section-label">{label}</span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-[rgba(201,168,76,0.07)] border border-[rgba(201,168,76,0.12)] flex items-center justify-center">
            <Icon size={13} className="text-[#c9a84c]" strokeWidth={1.75} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-0.5">
        <span className={`text-[2.2rem] font-semibold leading-none tracking-tight ${locked ? 'text-[#3a3a42]' : 'text-white'}`}>
          {locked ? '—' : value}
        </span>
      </div>

      <p className="text-[#5a5a66] text-xs mb-4 mt-1 leading-relaxed">{sublabel}</p>

      {/* Change badge */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
        isGoldRequired
          ? 'bg-[rgba(201,168,76,0.07)] text-[#c9a84c] border border-[rgba(201,168,76,0.18)]'
          : 'bg-[rgba(76,175,125,0.08)] text-[#4caf7d] border border-[rgba(76,175,125,0.18)]'
      }`}>
        {isGoldRequired
          ? <span className="w-1 h-1 rounded-full bg-[#c9a84c] pulse-glow" />
          : <span className="w-1 h-1 rounded-full bg-[#4caf7d]" />
        }
        {change}
      </div>
    </motion.div>
  )
}
