'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Brain, Clock, Compass, LineChart, Lock, LucideIcon, Target } from 'lucide-react'
import { resetLessons } from '@/lib/mockData'

const STAGE_ICONS: Record<string, LucideIcon> = {
  'Foundations': Compass,
  'Reading the Market': LineChart,
  'Timeframes & Bias': Clock,
  'The 5GM Method': Target,
  'Mindset & Career': Brain,
}

const stages = Array.from(new Set(resetLessons.map(l => l.stage))).map(stage => {
  const lessons = resetLessons.filter(l => l.stage === stage)
  const presenters = Array.from(new Set(lessons.map(l => l.presenter)))
  const numbers = lessons.map(l => l.number)
  return {
    stage,
    lessons,
    presenters,
    range: `${String(Math.min(...numbers)).padStart(2, '0')}–${String(Math.max(...numbers)).padStart(2, '0')}`,
  }
})

export default function ResetRoadmap() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative">
        {/* Flowing connecting line */}
        <motion.div
          className="absolute left-[23px] sm:left-7 top-2 bottom-2 w-[3px] rounded-full"
          style={{
            background: 'repeating-linear-gradient(180deg, rgba(201,168,76,0.85) 0%, rgba(201,168,76,0.85) 8%, rgba(201,168,76,0.15) 8%, rgba(201,168,76,0.15) 16%)',
            backgroundSize: '100% 240px',
            boxShadow: '0 0 12px rgba(201,168,76,0.25)',
          }}
          animate={{ backgroundPositionY: ['0px', '240px'] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
        />

        <div className="space-y-4">
        {stages.map((group, stageIndex) => {
          const Icon = STAGE_ICONS[group.stage] ?? Compass
          return (
            <motion.div
              key={group.stage}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: stageIndex * 0.08 }}
              viewport={{ once: true, margin: '-60px' }}
              className="group relative flex items-center gap-5 p-3 pr-5 sm:pr-6 rounded-2xl card card-gold card-lift cursor-default overflow-hidden"
            >
              {/* Icon node */}
              <div
                className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)',
                  boxShadow: '0 0 0 4px #0a0a0b, 0 0 28px rgba(201,168,76,0.3)',
                }}
              >
                <Icon size={20} className="text-black" strokeWidth={2} />
              </div>

              {/* Content */}
              <div className="relative flex-1 min-w-0">
                <p className="section-label mb-0.5" style={{ color: '#c9a84c', opacity: 1 }}>
                  Stage {stageIndex + 1} · Lessons {group.range}
                </p>
                <h3 className="text-white font-medium text-lg sm:text-xl mb-1.5">{group.stage}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {group.presenters.map(p => (
                    <span key={p} className="flex items-center gap-1.5 text-[11px] text-[#8e8e9a]">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-black shrink-0"
                        style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 100%)' }}
                      >
                        {p[0]}
                      </span>
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lesson count + lock */}
              <div className="relative flex flex-col items-end gap-2 shrink-0">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full text-[#8e8e9a]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {group.lessons.length} Lessons
                </span>
                <Lock size={12} className="text-[#3a3a46]" strokeWidth={2} />
              </div>
            </motion.div>
          )
        })}
        </div>
      </div>

      {/* Summary + CTA strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, margin: '-40px' }}
        className="relative mt-8 p-6 sm:p-8 rounded-2xl text-center overflow-hidden"
        style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.16)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%)' }} />
        <div className="relative">
          <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest mb-4">
            20 Lessons · 5 Mentors · 100% Free
          </p>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all shadow-lg shadow-[rgba(201,168,76,0.15)]"
          >
            Start The Reset — Free
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
