'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Settings } from 'lucide-react'

type Settings = {
  platform_name: string
  launch_status: string
  gold_access_status: string
  allow_signups: boolean
  default_user_plan: string
}

const defaultSettings: Settings = {
  platform_name: '5GM Gold',
  launch_status: 'live',
  gold_access_status: 'live',
  allow_signups: true,
  default_user_plan: 'free',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setSettings({
            platform_name: String(data.platform_name ?? defaultSettings.platform_name),
            launch_status: String(data.launch_status ?? defaultSettings.launch_status),
            gold_access_status: String(data.gold_access_status ?? defaultSettings.gold_access_status),
            allow_signups: Boolean(data.allow_signups ?? defaultSettings.allow_signups),
            default_user_plan: String(data.default_user_plan ?? defaultSettings.default_user_plan),
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    showToast('Settings saved')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-full py-32">
      <Loader2 size={24} className="animate-spin text-[#c9a84c]" />
    </div>
  )

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-2xl mx-auto px-6 md:px-8 py-8 space-y-6">

        <div>
          <p className="section-label mb-1.5">Admin</p>
          <h1 className="text-2xl font-light text-white tracking-tight">Platform Settings</h1>
          <p className="text-[#5a5a66] text-sm mt-1">Global configuration for the 5GM Gold platform.</p>
        </div>

        {/* General */}
        <div className="p-6 rounded-2xl space-y-5"
          style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-white font-medium text-sm flex items-center gap-2">
            <Settings size={13} className="text-[#c9a84c]" /> General
          </h2>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Platform Name</label>
            <input value={settings.platform_name}
              onChange={e => setSettings(p => ({ ...p, platform_name: e.target.value }))}
              className="input-dark w-full text-sm" />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Default User Plan</label>
            <select value={settings.default_user_plan}
              onChange={e => setSettings(p => ({ ...p, default_user_plan: e.target.value }))}
              className="input-dark w-full text-sm">
              <option value="free">Free</option>
              <option value="gold">Gold</option>
            </select>
            <p className="text-[#3a3a46] text-[10px] mt-1.5">Plan assigned to new users on signup.</p>
          </div>
        </div>

        {/* Access Control */}
        <div className="p-6 rounded-2xl space-y-5"
          style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-white font-medium text-sm">Access Control</h2>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Platform Launch Status</label>
            <select value={settings.launch_status}
              onChange={e => setSettings(p => ({ ...p, launch_status: e.target.value }))}
              className="input-dark w-full text-sm">
              <option value="coming_soon">Coming Soon (public locked)</option>
              <option value="live">Live (public accessible)</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <p className="text-[#3a3a46] text-[10px] mt-1.5">Controls whether the public-facing site is accessible.</p>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Gold Access Status</label>
            <select value={settings.gold_access_status}
              onChange={e => setSettings(p => ({ ...p, gold_access_status: e.target.value }))}
              className="input-dark w-full text-sm">
              <option value="coming_soon">Coming Soon (gold content locked)</option>
              <option value="live">Live (gold members have full access)</option>
            </select>
            <p className="text-[#3a3a46] text-[10px] mt-1.5">Controls whether gold members can access premium content.</p>
          </div>

          <div className="flex items-center justify-between py-3 px-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-white text-sm font-medium">Allow New Signups</p>
              <p className="text-[#5a5a66] text-xs mt-0.5">Let new users register for an account.</p>
            </div>
            <div onClick={() => setSettings(p => ({ ...p, allow_signups: !p.allow_signups }))}
              className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer`}
              style={{
                background: settings.allow_signups ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${settings.allow_signups ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'}`,
                width: 40, height: 22,
              }}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${settings.allow_signups ? 'left-[20px] bg-[#c9a84c]' : 'left-0.5 bg-[#5a5a66]'}`} />
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="p-6 rounded-2xl space-y-3"
          style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(239,68,68,0.12)' }}>
          <h2 className="text-red-400 font-medium text-sm">Danger Zone</h2>
          <p className="text-[#5a5a66] text-xs">Destructive actions like clearing all content or resetting users. These controls will be added in a future release.</p>
          <div className="flex gap-2">
            <button disabled
              className="px-3 py-2 rounded-xl text-xs font-medium opacity-30 cursor-not-allowed"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              Export All Data
            </button>
            <button disabled
              className="px-3 py-2 rounded-xl text-xs font-medium opacity-30 cursor-not-allowed"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              Reset Platform
            </button>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Settings
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium z-50"
          style={{ background: 'rgba(17,17,19,0.98)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
