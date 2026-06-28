'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { TeamMember } from '@/lib/mockData'

interface TeamCardProps {
  member: TeamMember
  index?: number
}

function InstagramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  )
}

export default function TeamCard({ member, index = 0 }: TeamCardProps) {
  const socials = [
    { key: 'instagram', href: member.socials?.instagram, icon: <InstagramIcon /> },
    { key: 'twitter',   href: member.socials?.twitter,   icon: <XIcon /> },
    { key: 'youtube',   href: member.socials?.youtube,   icon: <YouTubeIcon /> },
    { key: 'tiktok',    href: member.socials?.tiktok,    icon: <TikTokIcon /> },
  ].filter(s => s.href)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      className="group relative flex flex-col overflow-hidden rounded-xl cursor-default"
      style={{
        background: '#0c0c0e',
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(201,168,76,0.25)'
        el.style.boxShadow = '0 0 40px rgba(201,168,76,0.07), 0 16px 48px rgba(0,0,0,0.5)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(255,255,255,0.06)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Gold top accent line on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px] z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.7) 50%, transparent 100%)' }}
      />

      {/* Image */}
      <div className="relative w-full overflow-hidden" style={{ height: '220px' }}>
        {member.image ? (
          <Image
            src={member.image}
            alt={member.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            style={{
              objectPosition: member.imagePosition ?? 'top center',
              transform: `scale(${member.imageScale ?? 1})`,
            }}
          />
        ) : (
          <div className="w-full h-full bg-[rgba(201,168,76,0.03)] flex items-center justify-center">
            <span className="text-[#c9a84c] text-5xl font-semibold opacity-20">
              {member.name.split(' ').map(w => w[0]).join('')}
            </span>
          </div>
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 35%, rgba(12,12,14,0.6) 70%, rgba(12,12,14,1) 100%)',
          }}
        />
      </div>

      {/* Text */}
      <div className="px-5 py-4 flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#c9a84c] mb-1.5">{member.role}</p>
          <h3 className="text-white font-semibold text-[15px] leading-snug">{member.name}</h3>
        </div>

        <p className="text-[#5a5a66] text-[11px] leading-relaxed">{member.bio}</p>

        <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* Socials */}
        {socials.length > 0 && (
          <div className="flex items-center gap-3">
            {socials.map(s => (
              <a
                key={s.key}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5a5a66] hover:text-[#c9a84c] transition-colors duration-200"
              >
                {s.icon}
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
