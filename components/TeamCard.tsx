'use client'

import { motion } from 'framer-motion'
import { TeamMember } from '@/lib/mockData'

interface TeamCardProps {
  member: TeamMember
  index?: number
}

export default function TeamCard({ member, index = 0 }: TeamCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group p-6 rounded-2xl card card-gold"
    >
      {/* Avatar */}
      <div className="w-16 h-16 rounded-2xl bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.12)] flex items-center justify-center mb-5">
        <span className="text-[#c9a84c] font-semibold text-xl">
          {member.name.split(' ').map(w => w[0]).join('')}
        </span>
      </div>

      <div className="mb-4">
        <h3 className="text-white font-semibold text-base mb-1">{member.name}</h3>
        <span className="text-[#c9a84c] text-xs font-medium tracking-wide">{member.role}</span>
      </div>

      <p className="text-[#5a5a66] text-sm leading-relaxed mb-5">{member.bio}</p>

      <div className="flex flex-wrap gap-2">
        {member.specialty.map(s => (
          <span
            key={s}
            className="px-2.5 py-1 rounded-lg bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.12)] text-[#8e8e9a] text-xs"
          >
            {s}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
