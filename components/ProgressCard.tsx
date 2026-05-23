'use client'

import { Lock, BookOpen } from 'lucide-react'
import { Module } from '@/lib/mockData'

interface ProgressCardProps {
  module: Module
  index?: number
}

export default function ProgressCard({ module, index = 0 }: ProgressCardProps) {
  return (
    <div className="group relative p-5 rounded-xl card overflow-hidden">
      {/* Number */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-[#5a5a66] text-xs font-mono">
          {String(index + 1).padStart(2, '0')}
        </span>
        {module.locked ? (
          <div className="w-6 h-6 rounded-md bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.15)] flex items-center justify-center">
            <Lock size={11} className="text-[#c9a84c]" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-md bg-[rgba(76,175,125,0.08)] border border-[rgba(76,175,125,0.15)] flex items-center justify-center">
            <BookOpen size={11} className="text-[#4caf7d]" />
          </div>
        )}
      </div>

      <h4 className="text-white font-medium text-sm mb-1.5">{module.title}</h4>
      <p className="text-[#5a5a66] text-xs leading-relaxed mb-4 line-clamp-2">{module.description}</p>

      {/* Meta */}
      <div className="flex items-center gap-4 mb-4 text-xs text-[#5a5a66]">
        <span>{module.lessons} lessons</span>
        <span>{module.duration}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
        {module.locked ? (
          <div className="h-full w-0" />
        ) : (
          <div
            className="h-full bg-[#c9a84c] rounded-full transition-all"
            style={{ width: `${module.progress}%` }}
          />
        )}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[#5a5a66] text-[11px]">{module.locked ? 'Locked' : `${module.progress}% complete`}</span>
        {module.locked && (
          <span className="text-[10px] text-[#c9a84c] tracking-widest uppercase">Gold</span>
        )}
      </div>
    </div>
  )
}
