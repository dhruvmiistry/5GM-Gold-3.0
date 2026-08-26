'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, RotateCcw, LucideIcon } from 'lucide-react'

interface CTASectionProps {
  title: string
  titleAccent?: string
  subtitle: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
  badge?: string
  badgeIcon?: LucideIcon
}

export default function CTASection({ title, titleAccent, subtitle, primaryLabel, primaryHref, secondaryLabel, secondaryHref, badge, badgeIcon: BadgeIcon = RotateCcw }: CTASectionProps) {
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
            className="inline-flex items-center rounded-full overflow-hidden mb-8"
            style={{ border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <span
              className="flex items-center justify-center w-8 h-8 shrink-0"
              style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)' }}
            >
              <BadgeIcon size={13} className="text-black" strokeWidth={2.25} />
            </span>
            <span className="pl-3 pr-4 py-1.5 text-white text-sm font-medium glass">{badge}</span>
          </motion.div>
        )}

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight mb-6"
        >
          <span className="text-white" style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontStyle: 'normal' }}>{title}</span>
          {titleAccent && (
            <>
              <br />
              <span className="font-display italic text-gold-gradient">{titleAccent}</span>
            </>
          )}
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
