'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { User, Mail, Bell, Shield, LogOut, ChevronRight } from 'lucide-react'
import Badge from '@/components/Badge'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [newContent, setNewContent] = useState(true)
  const [goldAnnouncements, setGoldAnnouncements] = useState(true)

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-all ${value ? 'bg-[#c9a84c]' : 'bg-[rgba(255,255,255,0.1)]'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${value ? 'translate-x-5' : ''}`}
      />
    </button>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-white mb-2">Settings</h1>
        <p className="text-[#5a5a66] text-sm">Manage your account and preferences.</p>
      </div>

      {/* Account */}
      <div className="rounded-2xl card divide-y divide-[rgba(255,255,255,0.06)]">
        <div className="p-5">
          <h2 className="text-white font-medium text-sm flex items-center gap-2 mb-4">
            <User size={15} className="text-[#c9a84c]" />
            Account
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[#5a5a66] text-xs uppercase tracking-wider mb-1.5">Name</label>
              <div className="input-dark text-white cursor-default">{user?.name ?? '—'}</div>
            </div>
            <div>
              <label className="block text-[#5a5a66] text-xs uppercase tracking-wider mb-1.5">Email</label>
              <div className="input-dark text-[#8e8e9a] cursor-default">{user?.email ?? '—'}</div>
            </div>
            <div>
              <label className="block text-[#5a5a66] text-xs uppercase tracking-wider mb-1.5">Trading Experience</label>
              <div className="input-dark text-[#8e8e9a] cursor-default capitalize">{user?.experience ?? '—'}</div>
            </div>
          </div>
        </div>

        {/* Account type */}
        <div className="p-5">
          <h2 className="text-white font-medium text-sm flex items-center gap-2 mb-4">
            <Shield size={15} className="text-[#c9a84c]" />
            Membership
          </h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)]">
            <div>
              <p className="text-white text-sm font-medium mb-1">Account Type</p>
              <div className="flex items-center gap-2">
                <Badge variant="muted">Free Member</Badge>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#5a5a66]" />
          </div>
          <div className="mt-4 p-4 rounded-xl bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.15)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
              <span className="text-[#c9a84c] text-xs font-semibold">Gold Access Coming Soon</span>
            </div>
            <p className="text-[#5a5a66] text-xs leading-relaxed">
              Gold premium access is in the final stages of preparation. You will be notified when access opens. All premium sections will unlock automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Email preferences */}
      <div className="rounded-2xl card">
        <div className="p-5">
          <h2 className="text-white font-medium text-sm flex items-center gap-2 mb-5">
            <Mail size={15} className="text-[#c9a84c]" />
            Email Preferences
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Weekly Content Updates', description: 'Be notified when new free briefings are uploaded', value: emailUpdates, onChange: setEmailUpdates },
              { label: 'New Briefing Alerts', description: 'Alerts when each new video goes live', value: newContent, onChange: setNewContent },
              { label: 'Gold Access Announcements', description: 'Updates about premium launch and Gold access', value: goldAnnouncements, onChange: setGoldAnnouncements },
            ].map(pref => (
              <div key={pref.label} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-medium">{pref.label}</p>
                  <p className="text-[#5a5a66] text-xs mt-0.5">{pref.description}</p>
                </div>
                <Toggle value={pref.value} onChange={pref.onChange} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl card">
        <div className="p-5">
          <h2 className="text-white font-medium text-sm flex items-center gap-2 mb-5">
            <Bell size={15} className="text-[#c9a84c]" />
            Platform Notifications
          </h2>
          <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)]">
            <p className="text-[#5a5a66] text-sm">In-platform notifications are always on for new content and announcements.</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-[rgba(232,87,87,0.15)] bg-[rgba(232,87,87,0.03)]">
        <div className="p-5">
          <h2 className="text-[#e85757] font-medium text-sm mb-4">Sign Out</h2>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(232,87,87,0.25)] text-[#e85757] text-sm hover:bg-[rgba(232,87,87,0.06)] transition-all"
          >
            <LogOut size={14} />
            Sign out of 5GM Gold
          </button>
        </div>
      </div>
    </div>
  )
}
