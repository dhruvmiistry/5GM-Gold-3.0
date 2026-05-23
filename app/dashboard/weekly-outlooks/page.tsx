'use client'

import { motion } from 'framer-motion'
import { Lock, TrendingUp } from 'lucide-react'

const previewOutlooks = [
  { title: 'Weekly Outlook — Week 21', traders: ['Trader One', 'Trader Two'], markets: ['Gold', 'DXY', 'NASDAQ'] },
  { title: 'Weekly Outlook — Week 20', traders: ['Trader One', 'Trader Three'], markets: ['EUR/USD', 'GBP/JPY', 'Gold'] },
  { title: 'Monthly Bias — May 2026', traders: ['Full Team'], markets: ['All Major Pairs'] },
  { title: 'Weekly Outlook — Week 19', traders: ['Trader Two', 'Trader Four'], markets: ['S&P 500', 'BTC', 'Indices'] },
]

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export default function WeeklyOutlooksPage() {
  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-10 space-y-8">

        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={11} className="text-[#c9a84c]" strokeWidth={2} />
              <p className="section-label" style={{ color: '#c9a84c', opacity: 1 }}>Gold Access Required</p>
            </div>
            <h1 className="text-[1.7rem] font-light text-white tracking-tight leading-snug mb-2">
              Weekly Outlooks
            </h1>
            <p className="text-[#5a5a66] text-sm max-w-lg">
              Full team market analysis every week. Know the narrative, the key levels, and the bias before the week begins.
            </p>
          </motion.div>
        </motion.div>

        {/* Locked notice */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(17,17,19,0.7)',
            border: '1px solid rgba(201,168,76,0.18)',
            boxShadow: '0 0 40px rgba(201,168,76,0.04) inset',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 60%)' }}
          />
          <div className="relative flex items-start gap-5 p-6">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(201,168,76,0.09)', border: '1px solid rgba(201,168,76,0.22)' }}
            >
              <TrendingUp size={18} className="text-[#c9a84c]" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-white font-medium text-base mb-1.5">Gold access is not open yet.</h3>
              <p className="text-[#5a5a66] text-sm leading-relaxed max-w-xl">
                Weekly Outlooks will be available to Gold members — full team analysis, video breakdowns of all major pairs, and a clear directional bias for the week ahead. Coming soon.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Blurred preview grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
          <p className="section-label mb-5">Preview</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {previewOutlooks.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.28 + i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                className="relative rounded-2xl overflow-hidden"
                style={{ background: 'rgba(17,17,19,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="select-none pointer-events-none p-5" style={{ filter: 'blur(3px)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgba(201,168,76,0.3)]" />
                    <span className="text-[#5a5a66] text-xs">Weekly Outlook</span>
                  </div>
                  <div
                    className="aspect-video rounded-xl mb-3 flex items-center justify-center"
                    style={{ background: 'rgba(201,168,76,0.03)' }}
                  >
                    <TrendingUp size={24} className="text-[rgba(201,168,76,0.2)]" />
                  </div>
                  <h3 className="text-[#8e8e9a] font-medium text-sm mb-1">{item.title}</h3>
                  <p className="text-[#5a5a66] text-xs">{item.traders.join(', ')}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.markets.map(m => (
                      <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.04)] text-[#5a5a66]">{m}</span>
                    ))}
                  </div>
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(10,10,11,0.55)', backdropFilter: 'blur(1px)' }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
                    >
                      <Lock size={13} className="text-[#c9a84c]" strokeWidth={2} />
                    </div>
                    <span className="text-[#c9a84c] text-xs font-medium">Gold Access</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
