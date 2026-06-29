'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { saveEmailPreferences, saveProfileName } from '@/lib/data'
import { User, Mail, Bell, Shield, LogOut, Check, Loader2 } from 'lucide-react'
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
    <button onClick={() => onChange(!value)}
      className="relative w-10 h-5 rounded-full transition-all duration-300 shrink-0"
      style={{ background: value ? 'rgba(201,168,76,0.85)' : 'rgba(255,255,255,0.1)', boxShadow: value ? '0 0 10px rgba(201,168,76,0.3)' : 'none' }}
    >
      <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300"
        style={{ transform: value ? 'translateX(1.25rem)' : 'translateX(0)' }} />
    </button>
  )
}

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth()
  const hasGoldAccess = user?.plan === 'gold' || user?.role === 'admin'

  const [nameValue, setNameValue] = useState(user?.name ?? '')
  const [nameEditing, setNameEditing] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState('')
  const [prefsError, setPrefsError] = useState('')

  const [emailUpdates, setEmailUpdates] = useState(user?.email_consent ?? true)
  const [marketing, setMarketing] = useState(user?.marketing_opt_in ?? false)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)

  const sectionStyle = { background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.07)' }

  const handleSaveName = async () => {
    if (!user || !nameValue.trim()) return
    setNameSaving(true)
    setNameError('')
    const result = await saveProfileName(user.id, nameValue.trim())
    setNameSaving(false)
    if (!result.success) {
      setNameError(result.error ?? 'Failed to save name')
      return
    }
    await refreshUser()
    setNameEditing(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  const handleSavePrefs = async () => {
    if (!user) return
    setPrefsSaving(true)
    setPrefsError('')
    const result = await saveEmailPreferences(user.id, { email_consent: emailUpdates, marketing_opt_in: marketing })
    setPrefsSaving(false)
    if (!result.success) {
      setPrefsError(result.error ?? 'Failed to save preferences')
      return
    }
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 2000)
  }

  const planLabel = user?.role === 'admin' ? 'Admin' : hasGoldAccess ? 'Gold Member' : 'Free Member'
  const planVariant = hasGoldAccess || user?.role === 'admin' ? 'gold' : 'muted'

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-2xl mx-auto px-6 md:px-8 py-8 md:py-10 space-y-8">

        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <p className="section-label mb-2">Account</p>
            <h1 className="text-[1.7rem] font-light text-white tracking-tight leading-snug mb-2">Settings</h1>
            <p className="text-[#5a5a66] text-sm">Manage your account and preferences.</p>
          </motion.div>
        </motion.div>

        {/* Account section */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
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
              {/* Editable name */}
              <div>
                <label className="block text-[#3a3a42] text-[10.5px] uppercase tracking-widest mb-1.5">Name</label>
                {nameEditing ? (
                  <div className="flex gap-2">
                    <input
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      className="input-dark flex-1 text-sm"
                      autoFocus
                    />
                    <button onClick={handleSaveName} disabled={nameSaving}
                      className="px-4 py-2.5 rounded-xl bg-[#c9a84c] text-black text-xs font-semibold hover:bg-[#e8c96d] transition-all disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {nameSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Save
                    </button>
                    <button onClick={() => { setNameEditing(false); setNameValue(user?.name ?? '') }}
                      className="px-3 py-2.5 rounded-xl text-[#5a5a66] hover:text-white text-xs transition-colors"
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 rounded-xl text-sm text-white"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {nameSaved ? (
                        <span className="text-[#c9a84c] flex items-center gap-1.5"><Check size={12} /> Saved</span>
                      ) : (user?.name ?? '—')}
                    </div>
                    <button onClick={() => setNameEditing(true)}
                      className="px-3 py-2.5 rounded-xl text-[#5a5a66] hover:text-white text-xs transition-colors"
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Edit
                    </button>
                  </div>
                )}
                {nameError && (
                  <p className="mt-1.5 text-xs text-[#e85757]">{nameError}</p>
                )}
              </div>

              {/* Read-only fields */}
              {[
                { label: 'Email', value: user?.email ?? '—' },
                { label: 'Trading Experience', value: user?.experience ?? '—' },
                { label: 'Member Since', value: user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-[#3a3a42] text-[10.5px] uppercase tracking-widest mb-1.5">{field.label}</label>
                  <div className="px-4 py-3 rounded-xl text-sm text-[#8e8e9a] capitalize"
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
            <div className="flex items-center justify-between p-4 rounded-xl mb-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div>
                <p className="text-white text-sm font-medium mb-1.5">Account Type</p>
                <Badge variant={planVariant}>{planLabel}</Badge>
              </div>
              {hasGoldAccess && (
                <div className="text-right">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow inline-block mr-1.5" />
                  <span className="text-[#c9a84c] text-xs font-medium">Active</span>
                </div>
              )}
            </div>

            {!hasGoldAccess && (
              <div className="relative rounded-xl p-4 overflow-hidden"
                style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.14)' }}
              >
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)' }} />
                <div className="relative flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
                  <span className="text-[#c9a84c] text-xs font-semibold">Gold Access Coming Soon</span>
                </div>
                <p className="text-[#5a5a66] text-xs leading-relaxed">
                  Gold premium access is in the final stages of preparation. You will be notified when access opens.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Email preferences */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="rounded-2xl overflow-hidden" style={sectionStyle}
        >
          <div className="p-6">
            <h2 className="text-white font-medium text-sm flex items-center gap-2 mb-5">
              <Mail size={14} className="text-[#c9a84c]" strokeWidth={1.75} />
              Email Preferences
            </h2>
            <div className="space-y-5">
              {[
                { label: 'Weekly Content Updates', description: 'Be notified when new free briefings are uploaded', value: emailUpdates, onChange: setEmailUpdates },
                { label: 'Marketing & Gold Launch Updates', description: 'Updates about Gold access launch and premium features', value: marketing, onChange: setMarketing },
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
            <button onClick={handleSavePrefs} disabled={prefsSaving}
              className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(201,168,76,0.1)] text-[#c9a84c] text-sm font-medium hover:bg-[rgba(201,168,76,0.16)] transition-all disabled:opacity-60"
              style={{ border: '1px solid rgba(201,168,76,0.2)' }}
            >
              {prefsSaving ? <Loader2 size={13} className="animate-spin" /> : prefsSaved ? <Check size={13} /> : null}
              {prefsSaved ? 'Saved!' : 'Save Preferences'}
            </button>
            {prefsError && (
              <p className="mt-2 text-xs text-[#e85757]">{prefsError}</p>
            )}
          </div>
        </motion.div>

        {/* Platform notifications */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.26, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="rounded-2xl overflow-hidden" style={sectionStyle}
        >
          <div className="p-6">
            <h2 className="text-white font-medium text-sm flex items-center gap-2 mb-5">
              <Bell size={14} className="text-[#c9a84c]" strokeWidth={1.75} />
              Platform Notifications
            </h2>
            <div className="p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-[#5a5a66] text-sm">In-platform notifications are always on for new content and announcements.</p>
            </div>
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.34, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(232,87,87,0.03)', border: '1px solid rgba(232,87,87,0.12)' }}
        >
          <div className="p-6">
            <h2 className="text-[#e85757] font-medium text-sm mb-4">Sign Out</h2>
            <button onClick={logout}
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
