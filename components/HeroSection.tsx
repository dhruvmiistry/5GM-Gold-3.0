'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center hero-bg overflow-hidden pt-16">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(201,168,76,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Gold glow orb */}
      <div className="absolute top-20 right-[10%] w-[500px] h-[500px] rounded-full bg-[rgba(201,168,76,0.04)] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-[5%] w-[300px] h-[300px] rounded-full bg-[rgba(201,168,76,0.02)] blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Pre-title badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[rgba(201,168,76,0.2)] mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
          <span className="text-[#c9a84c] text-xs font-medium tracking-widest uppercase">Gold Access Coming Soon</span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-light text-white leading-[1.1] tracking-tight mb-6"
        >
          Your private trading
          <br />
          <span className="text-gold-gradient font-normal">command centre.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[#8e8e9a] text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto mb-10"
        >
          Built for traders serious about refinement, discipline and execution.
          Free weekly briefings. Premium mentorship coming soon.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/signup"
            className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all shadow-lg shadow-[rgba(201,168,76,0.2)] hover:shadow-[rgba(201,168,76,0.3)]"
          >
            Join Free Access
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/dashboard/free-briefings"
            className="group flex items-center gap-2 px-8 py-4 rounded-xl border border-[rgba(255,255,255,0.1)] text-white text-sm font-medium hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.03)] transition-all"
          >
            <Play size={14} className="text-[#c9a84c]" />
            Watch Latest Briefing
          </Link>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-8 text-center"
        >
          {[
            { value: '4', label: 'Professional Traders' },
            { value: '3×', label: 'Weekly Briefings' },
            { value: 'Free', label: 'Platform Access' },
            { value: 'Gold', label: 'Premium Coming Soon' },
          ].map(s => (
            <div key={s.label} className="flex flex-col gap-1">
              <span className="text-2xl font-semibold text-[#c9a84c]">{s.value}</span>
              <span className="text-[#5a5a66] text-xs tracking-wide">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0b] to-transparent pointer-events-none" />
    </section>
  )
}
