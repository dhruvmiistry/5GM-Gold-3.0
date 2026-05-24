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
      style={{ background: 'rgba(17,17,19,0.9)', border: '1px solid rgba(201,168,76,0.1)' }}
    >
      {/* Blurred content skeleton */}
      <div className="select-none pointer-events-none" style={{ filter: 'blur(4px)' }}>
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
                background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)',
              }}
            >
              <div className="flex gap-0.5 items-end opacity-20">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-[#c9a84c] rounded-full"
                    style={{ width: '3px', height: `${14 + Math.sin(i * 0.9) * 16 + (i % 3) * 8}px` }}
                  />
                ))}
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="h-3 rounded-full w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-2.5 rounded-full w-1/2" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="h-2.5 rounded-full w-2/3" style={{ background: 'rgba(255,255,255,0.03)' }} />
            </div>
          </>
        )}
      </div>

      {/* Gold top border accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)' }}
      />

      {/* Lock overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-0"
        style={{
          background: 'linear-gradient(160deg, rgba(10,10,11,0.72) 0%, rgba(10,10,11,0.82) 100%)',
          backdropFilter: 'blur(3px)',
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
          style={{
            background: 'rgba(201,168,76,0.07)',
            border: '1px solid rgba(201,168,76,0.22)',
            boxShadow: '0 0 16px rgba(201,168,76,0.08)',
          }}
        >
          <Lock size={14} className="text-[#c9a84c]" strokeWidth={1.75} />
        </div>

        {type && (
          <span className="text-[9px] text-[#c9a84c] font-semibold tracking-[0.14em] uppercase mb-1.5 opacity-80">{type}</span>
        )}
        <p className="text-white text-[13px] font-medium text-center px-5 leading-snug mb-1">{title}</p>
        {description && (
          <p className="text-[#5a5a66] text-[11px] text-center mt-1 px-6 leading-relaxed">{description}</p>
        )}

        <div
          className="mt-4 px-3.5 py-1.5 rounded-full flex items-center gap-1.5"
          style={{
            background: 'rgba(201,168,76,0.05)',
            border: '1px solid rgba(201,168,76,0.18)',
          }}
        >
          <span className="w-1 h-1 rounded-full bg-[#c9a84c] opacity-70" />
          <span className="text-[#c9a84c] text-[10px] font-medium tracking-wide">Gold Access</span>
        </div>
      </div>
    </motion.div>
  )
}
