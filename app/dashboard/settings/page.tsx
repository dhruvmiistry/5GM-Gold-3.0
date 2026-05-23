'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { User, Mail, Bell, Shield, LogOut, ChevronRight } from 'lucide-react'
import Badge from '@/components/Badge'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative w-10 h-5 rounded-full transition-all duration-300 shrink-0"
      style={{
        background: value ? 'rgba(201,168,76,0.85)' : 'rgba(255,255,255,0.1)',
        boxShadow: value ? '0 0 10px rgba(201,168,76,0.3)' : 'none',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300"
        style={{ transform: value ? 'translateX(1.25rem)' : 'translateX(0)' }}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [newContent, setNewContent] = useState(true)
  const [goldAnnouncements, setGoldAnnouncements] = useState(true)

  const sectionStyle = {
    background: 'rgba(17,17,19,0.85)',
    border: '1px solid rgba(255,255,255,0.07)',
  }

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-2xl mx-auto px-6 md:px-8 py-8 md:py-10 space-y-8">

        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <p className="section-label mb-2">Account</p>
            <h1 className="text-[1.7rem] font-light text-white tracking-tight leading-snug mb-2">
              Settings
            </h1>
            <p className="text-[#5a5a66] text-sm">Manage your account and preferences.</p>
          </motion.div>
        </motion.div>

        {/* Account section */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="rounded-2xl overflow-hidden divide-y divide-[rgba(255,255,255,0.06)]"
          style={sectionStyle}
        >
          <div className="p-6">
            <h2 className="text-white font-medium text-sm flex items-center gap-2 mb-5">
              <User size={14} className="text-[#c9a84c]" strokeWidth={1.75} />
              Account
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Name', value: user?.name ?? '—', muted: false },
                { label: 'Email', value: user?.email ?? '—', muted: true },
                { label: 'Trading Experience', value: user?.experience ?? '—', muted: true },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-[#3a3a42] text-[10.5px] uppercase tracking-widest mb-1.5">
                    {field.label}
                  </label>
                  <div
                    className={`px-4 py-3 rounded-xl text-sm capitalize ${field.muted ? 'text-[#8e8e9a]' : 'text-white'}`}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-white font-medium text-sm flex items-center gap-2 mb-5">
              <Shield size={14} className="text-[#c9a84c]" strokeWidth={1.75} />
              Membership
            </h2>
            <div
              className="flex items-center justify-between p-4 rounded-xl mb-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div>
                <p className="text-white text-sm font-medium mb-1.5">Account Type</p>
                <Badge variant="muted">Free Member</Badge>
              </div>
              <ChevronRight size={15} className="text-[#3a3a42]" strokeWidth={1.75} />
            </div>
            <div
              className="relative rounded-xl p-4 overflow-hidden"
              style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.14)' }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)' }}
              />
              <div className="relative flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
                <span className="text-[#c9a84c] text-xs font-semibold">Gold Access Coming Soon</span>
              </div>
              <p className="text-[#5a5a66] text-xs leading-relaxed">
                Gold premium access is in the final stages of preparation. You will be notified when access opens. All premium sections will unlock automatically.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Email preferences */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="rounded-2xl overflow-hidden"
          style={sectionStyle}
        >
          <div className="p-6">
            <h2 className="text-white font-medium text-sm flex items-center gap-2 mb-5">
              <Mail size={14} className="text-[#c9a84c]" strokeWidth={1.75} />
              Email Preferences
            </h2>
            <div className="space-y-5">
              {[
                { label: 'Weekly Content Updates', description: 'Be notified when new free briefings are uploaded', value: emailUpdates, onChange: setEmailUpdates },
                { label: 'New Briefing Alerts', description: 'Alerts when each new video goes live', value: newContent, onChange: setNewContent },
                { label: 'Gold Access Announcements', description: 'Updates about premium launch and Gold access', value: goldAnnouncements, onChange: setGoldAnnouncements },
              ].map(pref => (
                <div key={pref.label} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white text-sm font-medium">{pref.label}</p>
                    <p className="text-[#5a5a66] text-xs mt-0.5 leading-relaxed">{pref.description}</p>
                  </div>
                  <Toggle value={pref.value} onChange={pref.onChange} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Platform notifications */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.26, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="rounded-2xl overflow-hidden"
          style={sectionStyle}
        >
          <div className="p-6">
            <h2 className="text-white font-medium text-sm flex items-center gap-2 mb-5">
              <Bell size={14} className="text-[#c9a84c]" strokeWidth={1.75} />
              Platform Notifications
            </h2>
            <div
              className="p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-[#5a5a66] text-sm">In-platform notifications are always on for new content and announcements.</p>
            </div>
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.34, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(232,87,87,0.03)', border: '1px solid rgba(232,87,87,0.12)' }}
        >
          <div className="p-6">
            <h2 className="text-[#e85757] font-medium text-sm mb-4">Sign Out</h2>
            <button
              onClick={logout}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[#e85757] text-sm font-medium transition-all duration-200 hover:bg-[rgba(232,87,87,0.07)]"
              style={{ border: '1px solid rgba(232,87,87,0.22)' }}
            >
              <LogOut size={13} strokeWidth={1.75} />
              Sign out of 5GM Gold
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
