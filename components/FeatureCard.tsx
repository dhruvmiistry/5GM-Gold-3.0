'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  locked?: boolean
  index?: number
}

export default function FeatureCard({ icon: Icon, title, description, locked = false, index = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      viewport={{ once: true }}
      className="group relative p-6 rounded-2xl card card-gold cursor-default"
    >
      {locked && (
        <div className="absolute top-4 right-4">
          <span className="text-[10px] text-[#5a5a66] border border-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded-full">Gold</span>
        </div>
      )}

      <div className="w-10 h-10 rounded-xl bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)] flex items-center justify-center mb-4 group-hover:bg-[rgba(201,168,76,0.12)] transition-colors">
        <Icon size={18} className="text-[#c9a84c]" />
      </div>

      <h3 className="text-white font-medium text-base mb-2">{title}</h3>
      <p className="text-[#5a5a66] text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}
