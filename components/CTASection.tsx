'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface CTASectionProps {
  title: string
  subtitle: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
  badge?: string
}

export default function CTASection({ title, subtitle, primaryLabel, primaryHref, secondaryLabel, secondaryHref, badge }: CTASectionProps) {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[rgba(201,168,76,0.04)] blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {badge && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[rgba(201,168,76,0.2)] mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
            <span className="text-[#c9a84c] text-xs font-medium tracking-widest uppercase">{badge}</span>
          </motion.div>
        )}

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-light text-white leading-tight mb-5"
        >
          {title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-[#8e8e9a] text-lg font-light leading-relaxed mb-10"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href={primaryHref}
            className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all shadow-lg shadow-[rgba(201,168,76,0.15)]"
          >
            {primaryLabel}
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="px-8 py-4 rounded-xl border border-[rgba(255,255,255,0.1)] text-white text-sm font-medium hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.03)] transition-all"
            >
              {secondaryLabel}
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  )
}
