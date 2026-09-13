'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, ClipboardCheck } from 'lucide-react'

interface FunnelCopy {
  funnel_state: string
  headline: string
  offer_headline: string
  scarcity_copy: string
  cta_label: string
}

interface ExistingApplication {
  status: string
}

// Promotional banner for the Gold Desk application funnel — the top
// priority slot on the member dashboard, sitting above The Reset while
// applications are open (or teased). Deliberately bigger/louder than the
// Reset hero card below it: this is a live, scarce, time-sensitive
// opportunity, not evergreen curriculum. Links through to the full sales
// page at /dashboard/gold rather than duplicating it here. Swaps to a
// "check your status" variant once the member has already applied.
export default function GoldPromoCard() {
  const [copy, setCopy] = useState<FunnelCopy | null>(null)
  const [application, setApplication] = useState<ExistingApplication | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/gold/funnel-copy').then(r => r.json()).catch(() => null),
      fetch('/api/gold/applications').then(r => r.json()).catch(() => null),
    ]).then(([copyData, applicationData]) => {
      setCopy(copyData)
      setApplication(applicationData ?? null)
      setLoading(false)
    })
  }, [])

  if (loading || !copy) return null
  if (copy.funnel_state !== 'teaser' && copy.funnel_state !== 'applications_open') return null

  const isOpen = copy.funnel_state === 'applications_open'
  const hasActiveApplication = application && !['rejected', 'archived'].includes(application.status)
  const ctaActive = hasActiveApplication || isOpen

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
    >
      <Link
        href={hasActiveApplication ? '/dashboard/gold/apply' : '/dashboard/gold'}
        className="group relative flex flex-col sm:flex-row sm:items-center gap-6 overflow-hidden rounded-3xl p-7 sm:p-9 transition-transform hover:-translate-y-0.5"
        style={{
          background: 'rgba(201,168,76,0.07)',
          border: '1px solid rgba(201,168,76,0.28)',
          boxShadow: '0 20px 60px rgba(201,168,76,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 75% 65% at 10% 0%, rgba(201,168,76,0.14) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 shimmer pointer-events-none opacity-60" />

        {!hasActiveApplication && (
          <div className="absolute top-5 right-6 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c]">Live Now</span>
          </div>
        )}

        <div className="relative shrink-0">
          <motion.div
            className="absolute -inset-3 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.4) 0%, transparent 70%)', filter: 'blur(14px)' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)' }}
          >
            {hasActiveApplication ? <ClipboardCheck size={24} className="text-black" strokeWidth={2} /> : <ShieldCheck size={24} className="text-black" strokeWidth={2} />}
          </div>
        </div>

        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[#c9a84c] text-xs font-bold uppercase tracking-widest">
              {hasActiveApplication ? 'Gold Desk' : isOpen ? copy.offer_headline : 'Coming Soon'}
            </span>
            {!hasActiveApplication && copy.scarcity_copy && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(201,168,76,0.14)', color: '#e8c96d', border: '1px solid rgba(201,168,76,0.3)' }}>
                {copy.scarcity_copy.trim()}
              </span>
            )}
          </div>
          <h2 className="text-white text-xl sm:text-[1.65rem] font-medium tracking-tight leading-snug mb-1.5">
            {hasActiveApplication ? 'Your Gold Desk application is in progress' : copy.headline}
          </h2>
          <p className="text-[#9a9aa6] text-sm sm:text-[15px] leading-relaxed max-w-lg">
            {hasActiveApplication
              ? 'Check where things stand and what happens next.'
              : isOpen
              ? 'Applications are open now — Week 1 is completely free.'
              : 'Applications aren’t open yet — check back soon.'}
          </p>
        </div>

        <div
          className="relative flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-[15px] shrink-0 transition-all group-hover:scale-[1.03]"
          style={
            ctaActive
              ? { background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)', color: '#0a0a0b', boxShadow: '0 8px 30px rgba(201,168,76,0.35)' }
              : { background: 'rgba(255,255,255,0.06)', color: '#8e8e9a' }
          }
        >
          {hasActiveApplication ? 'Check Status' : isOpen ? copy.cta_label : 'Learn More'}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </motion.div>
  )
}
