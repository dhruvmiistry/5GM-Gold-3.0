'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import MuxPlayer from '@/components/MuxPlayer'
import {
  Loader2, Radio, Users, BookOpen, TrendingUp, BarChart3, LineChart,
  Building2, Wallet, ArrowRight,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }

interface FunnelCopy {
  funnel_state: string
  headline: string
  subheadline: string
  offer_headline: string
  scarcity_copy: string
  cta_label: string
  week1_start_date: string | null
  application_deadline: string | null
  vsl_mux_playback_id: string | null
  vsl_poster_url: string | null
  confirmation_headline: string
  confirmation_body: string
}

const PROGRAMME_PILLARS = [
  { label: 'Live Trading', description: 'Trade live alongside the 5GM team, in real time.', icon: Radio },
  { label: 'Weekly Analyst Sessions', description: 'Direct access to the analysts, every single week.', icon: Users },
  { label: 'Full Model Education', description: 'The complete 5GM trading model, start to finish.', icon: BookOpen },
  { label: 'Trader Development', description: 'Structured coaching to sharpen your execution.', icon: TrendingUp },
  { label: 'Scaling', description: 'A clear, guided path to scaling your account.', icon: BarChart3 },
  { label: 'Futures', description: 'Futures markets, covered in real depth.', icon: LineChart },
  { label: 'Prop Firm Development', description: 'Get funded and grow with a prop firm.', icon: Building2 },
  { label: 'Personal Account Development', description: 'Build and compound your own trading capital.', icon: Wallet },
]

function logEvent(eventType: string, metadata?: Record<string, unknown>) {
  fetch('/api/gold/events', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, metadata }),
  }).catch(() => {})
}

function ApplyButton({ disabled, label, className = '' }: { disabled: boolean; label: string; className?: string }) {
  if (disabled) {
    return (
      <button disabled className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm opacity-40 cursor-not-allowed ${className}`}
        style={{ background: 'rgba(255,255,255,0.06)', color: '#8e8e9a' }}>
        {label}
      </button>
    )
  }
  return (
    <div className={`relative inline-flex ${className}`}>
      <div className="absolute -inset-3 rounded-full pointer-events-none animate-pulse"
        style={{ background: 'radial-gradient(ellipse, rgba(201,168,76,0.35) 0%, transparent 70%)', filter: 'blur(14px)' }} />
      <Link href="/dashboard/gold/apply" onClick={() => logEvent('apply_cta_clicked')}
        className="group relative flex items-center justify-center gap-2 px-9 py-4 rounded-xl font-bold text-[15px] text-black transition-all hover:scale-[1.03] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)',
          boxShadow: '0 8px 30px rgba(201,168,76,0.35), 0 0 0 1px rgba(201,168,76,0.4)',
        }}>
        {label} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  )
}

export default function GoldDeskPage() {
  const [copy, setCopy] = useState<FunnelCopy | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/gold/funnel-copy').then(r => r.json()).then(d => { setCopy(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (copy && copy.funnel_state !== 'hidden') logEvent('vsl_viewed') }, [copy])

  if (loading) {
    return (
      <div className="dashboard-bg min-h-full flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
      </div>
    )
  }

  if (!copy || copy.funnel_state === 'hidden') {
    return (
      <div className="dashboard-bg min-h-full flex items-center justify-center py-24">
        <p className="text-[#5a5a66] text-sm">The Gold Desk isn&rsquo;t open yet — check back soon.</p>
      </div>
    )
  }

  const isTeaser = copy.funnel_state === 'teaser'
  const isOpen = copy.funnel_state === 'applications_open'
  // Only 'applications_open' actually accepts a submission server-side (see
  // POST /api/gold/applications) — every other state must disable the CTA
  // too, or a visitor can fill out the entire multi-step form and only find
  // out it's rejected on final submit.
  const ctaDisabled = !isOpen
  const ctaLabel = isTeaser ? 'Coming Soon' : isOpen ? copy.cta_label : 'Applications Closed'
  // Always reinforces "free" on the button itself, matching the homepage's
  // own "Start The Reset — Free" convention — unless the admin-edited label
  // already says it, or the CTA is disabled ("Coming Soon — Free" reads wrong).
  const ctaLabelWithFree = !ctaDisabled && !/free/i.test(ctaLabel) ? `${ctaLabel} — Free` : ctaLabel

  return (
    <div className="dashboard-bg min-h-full relative overflow-hidden">
      {/* Ambient gold light sources — same layered-glow language as the
          marketing hero section, scaled down for a dashboard-width page. */}
      <div className="absolute -top-24 right-[-10%] w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.03) 45%, transparent 70%)', filter: 'blur(50px)' }} />
      <div className="absolute top-[45%] left-[-15%] w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 65%)', filter: 'blur(60px)' }} />

      <div className="relative max-w-4xl mx-auto px-6 md:px-8 py-5 md:py-7 space-y-10">

        {/* Hero */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="text-center space-y-4 py-2">
          <motion.div variants={fadeUp} className="flex justify-center">
            <Image src="/logo.png" alt="5GM Gold" width={52} height={52} className="h-11 w-11 object-contain opacity-95" />
          </motion.div>

          <motion.div variants={fadeUp} className="flex justify-center">
            <div className="relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(201,168,76,0.09)', border: '1px solid rgba(201,168,76,0.32)' }}>
              <div className="absolute inset-0 shimmer pointer-events-none" />
              <span className="relative w-2 h-2 rounded-full bg-[#c9a84c] pulse-glow shrink-0" />
              <span className="relative text-xs font-bold uppercase tracking-widest text-gold-gradient">{copy.offer_headline}</span>
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-display text-[2.1rem] md:text-[2.9rem] text-white tracking-tight leading-[1.1] max-w-2xl mx-auto">
            {copy.headline}
          </motion.h1>

          <motion.p variants={fadeUp} className="text-[#8e8e9a] text-sm md:text-base font-light max-w-xl mx-auto leading-relaxed">
            {copy.subheadline}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 pt-3">
            <ApplyButton disabled={ctaDisabled} label={ctaLabelWithFree} />
            {copy.scarcity_copy && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mt-3"
                style={{ background: 'rgba(201,168,76,0.09)', border: '1px solid rgba(201,168,76,0.28)', color: '#c9a84c' }}>
                <span className="w-2 h-2 rounded-full bg-[#c9a84c] pulse-glow" /> {copy.scarcity_copy}
              </span>
            )}
            <p className="text-[#3a3a46] text-[11px]">Applications are reviewed before access is granted.</p>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-6 pt-1">
            {[['12', 'Weeks'], ['1', 'Free'], ['Live', 'Trading']].map(([value, label]) => (
              <div key={label}>
                <div className="text-xl font-semibold text-[#c9a84c]">{value}</div>
                <div className="text-[#5a5a66] text-xs tracking-wide mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* VSL — framed like the marketing hero's mentor image */}
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-4">
            <p className="section-label">Watch Before Applying</p>
            <p className="text-[#5a5a66] text-xs mt-1">Week 1 is 100% free — no card, no catch.</p>
          </div>
          <div className="relative">
            <motion.div
              className="absolute -inset-10 rounded-3xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 75% 65% at 50% 40%, rgba(201,168,76,0.28) 0%, transparent 70%)', filter: 'blur(36px)' }}
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
              className="relative rounded-2xl overflow-hidden"
              whileHover={{ scale: 1.008 }}
              animate={{
                boxShadow: [
                  '0 0 0 1px rgba(201,168,76,0.18), 0 40px 100px rgba(0,0,0,0.6), 0 0 70px rgba(201,168,76,0.16)',
                  '0 0 0 1px rgba(201,168,76,0.3), 0 40px 100px rgba(0,0,0,0.6), 0 0 100px rgba(201,168,76,0.26)',
                  '0 0 0 1px rgba(201,168,76,0.18), 0 40px 100px rgba(0,0,0,0.6), 0 0 70px rgba(201,168,76,0.16)',
                ],
              }}
              transition={{
                scale: { duration: 0.3 },
                boxShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-px z-10"
                style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(201,168,76,0.7) 50%, transparent 90%)' }} />
              {copy.vsl_mux_playback_id ? (
                <MuxPlayer
                  playbackId={copy.vsl_mux_playback_id}
                  title="5GM Gold — Week 1 Free"
                  thumbnailUrl={copy.vsl_poster_url ?? undefined}
                  onEnded={() => logEvent('vsl_completed')}
                />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center"
                  style={{ background: 'rgba(17,17,19,0.85)' }}>
                  <p className="text-[#5a5a66] text-sm">Video coming soon.</p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Programme preview */}
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5 }}
            className="text-center mb-8">
            <p className="section-label mb-2.5">Inside The Programme</p>
            <h2 className="font-display text-[1.6rem] md:text-[2rem] text-white tracking-tight">
              A complete system, <span className="text-gold-gradient italic">not a shortcut.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PROGRAMME_PILLARS.map(({ label, description, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group relative overflow-hidden p-5 rounded-2xl card card-gold card-lift"
                style={{ background: 'rgba(17,17,19,0.7)' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(201,168,76,0.08) 0%, transparent 65%)' }} />

                <span className="absolute top-4 right-5 text-[11px] font-mono text-[#3a3a46] tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="relative flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.25) 0%, transparent 70%)', filter: 'blur(6px)' }} />
                    <div className="relative w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)' }}>
                      <Icon size={18} className="text-black" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-white text-sm font-semibold leading-snug mb-1">{label}</p>
                    <p className="text-[#5a5a66] text-xs leading-relaxed">{description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* The 12-week journey — pure editorial typography, deliberately no
            cards/icons/lines. Only describes the 12-week programme itself —
            no claim about anything beyond it (no "ongoing access" promise). */}
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5 }}
            className="text-center mb-2">
            <p className="section-label mb-2.5">The Journey</p>
            <h2 className="font-display text-[1.6rem] md:text-[2rem] text-white tracking-tight">
              Twelve weeks. <span className="text-gold-gradient italic">One system.</span>
            </h2>
          </motion.div>

          <div className="flex items-center justify-center gap-8 md:gap-16 py-10">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5 }}
              className="text-center">
              <p className="font-display text-gold-gradient leading-none" style={{ fontSize: 'clamp(3.5rem, 10vw, 6rem)' }}>1</p>
              <p className="text-white text-sm font-medium mt-3">Week</p>
              <p className="text-[#5a5a66] text-[10px] uppercase tracking-widest mt-1">Free</p>
            </motion.div>

            <div className="w-px self-stretch my-2" style={{ background: 'linear-gradient(180deg, transparent, rgba(201,168,76,0.35), transparent)' }} />

            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center">
              <p className="font-display text-white leading-none" style={{ fontSize: 'clamp(3.5rem, 10vw, 6rem)' }}>12</p>
              <p className="text-white text-sm font-medium mt-3">Weeks</p>
              <p className="text-[#5a5a66] text-[10px] uppercase tracking-widest mt-1">Full Programme</p>
            </motion.div>
          </div>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center text-[#8e8e9a] text-sm md:text-base font-light max-w-md mx-auto leading-relaxed">
            One week free. Eleven more to build on it — live trading, full model education,
            and structured development with the 5GM team.
          </motion.p>
        </div>

        {/* Final CTA */}
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5 }}
          className="relative overflow-hidden text-center py-10 px-6 rounded-3xl space-y-4"
          style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.16)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 65%)' }} />
          <div className="relative space-y-4">
            <ApplyButton disabled={ctaDisabled} label={ctaLabelWithFree} className="mx-auto" />
            <p className="text-[#5a5a66] text-xs">Applications are reviewed by the 5GM team.</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
