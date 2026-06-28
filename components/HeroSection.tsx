'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Play } from 'lucide-react'

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
              <span className="text-[#c9a84c] text-xs font-medium tracking-widest uppercase">Private Trading Platform</span>
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
              Three free videos every week.
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
            </motion.div>
          </div>

          {/* Right — image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="relative hidden lg:block"
          >
            {/* outer ambient glow */}
            <div className="absolute -inset-8 rounded-3xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 40%, rgba(201,168,76,0.1) 0%, transparent 70%)', filter: 'blur(20px)' }} />

            {/* image frame */}
            <div className="relative rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(201,168,76,0.22)', boxShadow: '0 0 0 1px rgba(201,168,76,0.07), 0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(201,168,76,0.08)' }}>

              <Image
                src="/mentor3.png"
                alt="5GM Gold Mentor"
                width={640}
                height={760}
                className="w-full object-cover"
                priority
                style={{ filter: 'contrast(1.05) brightness(0.95)' }}
              />

              {/* bottom fade to bg */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,11,1) 0%, rgba(10,10,11,0.4) 25%, transparent 60%)' }} />
              {/* left fade to blend with text */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,10,11,0.35) 0%, transparent 35%)' }} />
              {/* subtle gold tint at top */}
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 40% at 70% 0%, rgba(201,168,76,0.07) 0%, transparent 60%)' }} />

              {/* top shimmer line */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(201,168,76,0.5) 50%, transparent 90%)' }} />

              {/* bottom floating badge */}
              <div className="absolute bottom-6 left-6 right-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.75 }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(10,10,11,0.75)', border: '1px solid rgba(201,168,76,0.18)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {['/mentor2.png', '/mentor1.png', '/mentor4.png'].map((src, i) => (
                        <div key={i} className="w-7 h-7 rounded-full overflow-hidden border-2 border-[#0d0d0f]">
                          <Image src={src} alt="" width={28} height={28} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-white text-xs font-semibold">4 analysts. One platform.</div>
                      <div className="text-[#5a5a66] text-[10px] mt-0.5">3 new videos every week</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
                    <span className="text-[#c9a84c] text-[10px] font-medium">Free</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0b] to-transparent pointer-events-none" />
    </section>
  )
}
