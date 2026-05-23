'use client'

import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

interface LockedCardProps {
  title: string
  description?: string
  type?: string
  className?: string
  compact?: boolean
  index?: number
}

export default function LockedCard({ title, description, type, className = '', compact = false, index = 0 }: LockedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Blurred content skeleton */}
      <div className="select-none pointer-events-none" style={{ filter: 'blur(3px)' }}>
        {compact ? (
          <div className="p-4 space-y-2">
            <div className="h-3 rounded-full w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-2.5 rounded-full w-1/2" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
        ) : (
          <>
            <div
              className="aspect-video flex items-center justify-center"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.03) 0%, transparent 70%)',
              }}
            />
            <div className="p-4 space-y-2">
              <div className="h-3 rounded-full w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-2.5 rounded-full w-1/2" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="h-2.5 rounded-full w-2/3" style={{ background: 'rgba(255,255,255,0.03)' }} />
            </div>
          </>
        )}
      </div>

      {/* Lock overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ background: 'rgba(10,10,11,0.6)', backdropFilter: 'blur(2px)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}
        >
          <Lock size={15} className="text-[#c9a84c]" strokeWidth={1.75} />
        </div>
        {type && (
          <span className="text-[10px] text-[#c9a84c] font-semibold tracking-widest uppercase mb-1">{type}</span>
        )}
        <p className="text-white text-sm font-medium text-center px-4 leading-snug">{title}</p>
        {description && (
          <p className="text-[#5a5a66] text-xs text-center mt-1.5 px-6 leading-relaxed">{description}</p>
        )}
        <div
          className="mt-4 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.16)' }}
        >
          <span className="text-[#c9a84c] text-xs font-medium">Gold Access Required</span>
        </div>
      </div>
    </motion.div>
  )
}
