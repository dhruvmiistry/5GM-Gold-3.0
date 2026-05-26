'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Play, TrendingUp } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center hero-bg overflow-hidden pt-16">
      {/* Primary gold light source — top right, behind image */}
      <div className="absolute -top-20 right-[-5%] w-[900px] h-[900px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.13) 0%, rgba(201,168,76,0.04) 40%, transparent 70%)', filter: 'blur(40px)' }}
      />
      {/* Secondary warm fill — mid right */}
      <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 65%)', filter: 'blur(60px)' }}
      />
      {/* Deep shadow — bottom left to ground the left column */}
      <div className="absolute bottom-0 left-0 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(0,0,0,0.6) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* Left — text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[rgba(201,168,76,0.2)] mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
              <span className="text-[#c9a84c] text-xs font-medium tracking-widest uppercase">Gold Access Coming Soon</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-5xl sm:text-6xl md:text-7xl text-white leading-[1.05] tracking-tight mb-6"
            >
              <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontStyle: 'normal' }}>The Private Platform</span>
              <br />
              <span className="text-gold-gradient">Built For Serious</span>
              <br />
              <span className="text-gold-gradient">Traders.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[#8e8e9a] text-lg font-light leading-relaxed max-w-lg mb-10"
            >
              Built for traders serious about refinement, discipline, and execution.
              Three free analyst videos every week. Gold tier launching soon.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start gap-4 mb-14"
            >
              <Link
                href="/signup"
                className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all shadow-lg shadow-[rgba(201,168,76,0.2)] hover:shadow-[rgba(201,168,76,0.35)]"
              >
                Join Free Access
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/dashboard/free-videos"
                className="group flex items-center gap-2 px-8 py-4 rounded-xl border border-[rgba(255,255,255,0.1)] text-white text-sm font-medium hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.03)] transition-all"
              >
                <Play size={14} className="text-[#c9a84c]" />
                Watch Latest Video
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex items-center gap-8"
            >
              {[
                { value: '4', label: 'Traders' },
                { value: '3×', label: 'Weekly' },
                { value: 'Free', label: 'Access' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-xl font-semibold text-[#c9a84c]">{s.value}</div>
                  <div className="text-[#5a5a66] text-xs tracking-wide mt-0.5">{s.label}</div>
                </div>
              ))}
              <div className="w-px h-8 bg-[rgba(255,255,255,0.07)]" />
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
                <span className="text-[#5a5a66] text-xs">Gold launching soon</span>
              </div>
            </motion.div>
          </div>

          {/* Right — image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="relative hidden lg:block"
          >
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden border border-[rgba(201,168,76,0.18)] shadow-[0_0_0_1px_rgba(201,168,76,0.08),0_32px_80px_rgba(0,0,0,0.5),0_0_60px_rgba(201,168,76,0.07)]">
              <Image
                src="/mentor3.png"
                alt="5GM Gold Mentor"
                width={640}
                height={760}
                className="w-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[rgba(10,10,11,0.1)] to-transparent opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-transparent to-transparent opacity-25" />
            </div>

            {/* Floating card — top right */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="absolute -top-4 -right-5 px-4 py-3 rounded-xl glass border border-[rgba(201,168,76,0.2)] shadow-xl"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[rgba(201,168,76,0.1)] flex items-center justify-center">
                  <TrendingUp size={13} className="text-[#c9a84c]" />
                </div>
                <div>
                  <div className="text-white text-xs font-semibold">Weekly Outlook</div>
                  <div className="text-[#5a5a66] text-[10px]">New every Monday</div>
                </div>
              </div>
            </motion.div>

            {/* Floating card — bottom left */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="absolute -bottom-4 -left-5 px-4 py-3 rounded-xl glass border border-[rgba(255,255,255,0.09)] shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1.5">
                  {['T1', 'T2', 'T3', 'T4'].map(t => (
                    <div key={t} className="w-6 h-6 rounded-full bg-[rgba(201,168,76,0.12)] border-2 border-[#0d0d0f] flex items-center justify-center">
                      <span className="text-[#c9a84c] text-[7px] font-bold">{t[1]}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-white text-xs font-medium">4 traders. Free access.</div>
                  <div className="text-[#5a5a66] text-[10px]">3 new videos every week</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0b] to-transparent pointer-events-none" />
    </section>
  )
}
