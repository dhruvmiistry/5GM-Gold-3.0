'use client'

import { motion } from 'framer-motion'
import { Lock, Shield, FileText } from 'lucide-react'
import { mockStrategyVault } from '@/lib/mockData'

const typeIcons: Record<string, React.ElementType> = {
  Playbook: FileText,
  Framework: Shield,
  Model: Shield,
  Manual: FileText,
  Protocol: Shield,
  Reference: FileText,
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export default function StrategyVaultPage() {
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
              Strategy Vault
            </h1>
            <p className="text-[#5a5a66] text-sm max-w-lg">
              Playbooks, execution models, frameworks, and reference documents from the full team.
            </p>
          </motion.div>
        </motion.div>

        {/* Locked notice */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="relative rounded-2xl overflow-hidden text-center py-10 px-6"
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
          <div className="relative z-10">
            <div
              className="w-13 h-13 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'rgba(201,168,76,0.09)',
                border: '1px solid rgba(201,168,76,0.22)',
                width: '3.25rem',
                height: '3.25rem',
              }}
            >
              <Shield size={20} className="text-[#c9a84c]" strokeWidth={1.75} />
            </div>
            <h3 className="text-white font-medium text-base mb-2">Premium resources coming soon.</h3>
            <p className="text-[#5a5a66] text-sm leading-relaxed max-w-md mx-auto">
              Complete playbooks, execution models, cheat sheets, and trade frameworks built by the team. Available exclusively to Gold members.
            </p>
          </div>
        </motion.div>

        {/* Resource grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
          <p className="section-label mb-5">Resources</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockStrategyVault.map((item, i) => {
              const Icon = typeIcons[item.type] || FileText
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.28 + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                  className="relative rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(17,17,19,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="select-none pointer-events-none p-5" style={{ filter: 'blur(3px)' }}>
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}
                      >
                        <Icon size={15} className="text-[#c9a84c]" />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#5a5a66] uppercase tracking-wider">{item.type}</span>
                        <h3 className="text-[#8e8e9a] font-medium text-sm mt-0.5">{item.title}</h3>
                      </div>
                    </div>
                    <p className="text-[#5a5a66] text-xs leading-relaxed">{item.description}</p>
                  </div>
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(10,10,11,0.55)', backdropFilter: 'blur(1px)' }}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
                      >
                        <Lock size={12} className="text-[#c9a84c]" strokeWidth={2} />
                      </div>
                      <span className="text-[11px] text-[#c9a84c] font-medium">Gold</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
