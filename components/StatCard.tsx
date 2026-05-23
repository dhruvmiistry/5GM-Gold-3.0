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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="p-5 rounded-2xl card relative overflow-hidden"
    >
      {/* Subtle gold accent for free content */}
      {!locked && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.3)] to-transparent" />
      )}

      <div className="flex items-start justify-between mb-3">
        <span className="text-[#5a5a66] text-xs font-medium uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-[rgba(201,168,76,0.06)] flex items-center justify-center">
            <Icon size={14} className="text-[#c9a84c]" />
          </div>
        )}
      </div>

      <div className="mb-1">
        <span className={`text-3xl font-semibold ${locked ? 'text-[#5a5a66]' : 'text-white'}`}>
          {locked ? '—' : value}
        </span>
      </div>

      <p className="text-[#5a5a66] text-xs mb-3">{sublabel}</p>

      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
        isGoldRequired
          ? 'bg-[rgba(201,168,76,0.06)] text-[#c9a84c] border border-[rgba(201,168,76,0.15)]'
          : 'bg-[rgba(76,175,125,0.08)] text-[#4caf7d] border border-[rgba(76,175,125,0.15)]'
      }`}>
        {isGoldRequired && <span className="w-1 h-1 rounded-full bg-[#c9a84c]" />}
        {change}
      </div>
    </motion.div>
  )
}
