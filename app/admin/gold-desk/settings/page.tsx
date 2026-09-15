'use client'

import { useState, useEffect } from 'react'
import {
  Save, Loader2, Shield, PenLine, EyeOff, Eye, Lock, Unlock,
  CheckCircle2, PhoneCall, type LucideIcon,
} from 'lucide-react'

// VSL settings were deliberately removed from this page — it's a single
// fixed video, not something that gets swapped via this UI. Dates were
// removed too: the funnel is opened/closed manually via Funnel State below,
// nothing here ever reads week1_start_date/application_deadline. Their
// columns still exist in gold_funnel_config and are untouched by this page
// — bring the UI back if that changes.
type Config = {
  funnel_state: string
  headline: string
  subheadline: string
  offer_headline: string
  scarcity_copy: string
  cta_label: string
  confirmation_headline: string
  confirmation_body: string
  call_booking_url: string
  invite_to_call_enabled: boolean
}

const defaultConfig: Config = {
  funnel_state: 'hidden',
  headline: '5GM Gold Starts Here.',
  subheadline: '',
  offer_headline: 'Week 1 Free',
  scarcity_copy: 'Only 25 places available',
  cta_label: 'Apply For Week 1',
  confirmation_headline: 'Application Received',
  confirmation_body: '',
  call_booking_url: '',
  invite_to_call_enabled: false,
}

function str(v: unknown, fallback: string) {
  return typeof v === 'string' ? v : fallback
}

function bool(v: unknown, fallback: boolean) {
  return typeof v === 'boolean' ? v : fallback
}

const TONE: Record<string, { fg: string; bg: string; border: string }> = {
  neutral: { fg: '#8e8e9a', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' },
  gold: { fg: '#e0c26e', bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.28)' },
  blue: { fg: '#7cb4fb', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.28)' },
}

// The only 4 states that mean anything distinct right now — 'week_one_active'
// and 'full_programme' used to live here too, but nothing in the codebase
// ever branched on them (the member page treated them identically to
// applications_closed), so they were just inert labels. Removed rather than
// left as dead options in the picker.
const FUNNEL_STATES: { value: string; label: string; description: string; icon: LucideIcon; tone: keyof typeof TONE }[] = [
  { value: 'hidden', label: 'Hidden', description: 'Campaign not shown at all', icon: EyeOff, tone: 'neutral' },
  { value: 'teaser', label: 'Teaser', description: 'VSL visible, Apply CTA disabled', icon: Eye, tone: 'blue' },
  { value: 'applications_open', label: 'Applications Open', description: 'Accepting new applications', icon: Unlock, tone: 'gold' },
  { value: 'applications_closed', label: 'Applications Closed', description: 'Page live, applying is off', icon: Lock, tone: 'neutral' },
]

function SectionCard({ title, icon: Icon, subtitle, children }: {
  title: string; icon?: LucideIcon; subtitle?: string; children: React.ReactNode
}) {
  return (
    <div className="p-6 rounded-2xl space-y-5 backdrop-blur-sm"
      style={{ background: 'rgba(17,17,19,0.75)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div>
        <h2 className="text-white font-medium text-sm flex items-center gap-2">
          {Icon && (
            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: TONE.gold.bg }}>
              <Icon size={12} style={{ color: TONE.gold.fg }} />
            </span>
          )}
          {title}
        </h2>
        {subtitle && <p className="text-[#3a3a46] text-[10.5px] mt-1.5 leading-relaxed">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, span, ...props }: { label: string; span?: 'full' } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={span === 'full' ? 'sm:col-span-2' : undefined}>
      <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">{label}</label>
      <input {...props} className="input-dark w-full text-sm" />
    </div>
  )
}

function ConfirmDialog({ busy, onConfirm, onCancel }: { busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: 'rgba(17,17,19,0.98)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <p className="text-sm text-white leading-relaxed mb-1">Publish these changes?</p>
        <p className="text-xs text-[#5a5a66] leading-relaxed mb-5">This updates the live /dashboard/gold page immediately.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#8e8e9a] transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium disabled:opacity-50 transition-all"
            style={{ color: '#0a0a0b', background: '#e0c26e' }}>
            {busy && <Loader2 size={11} className="animate-spin" />}
            Publish
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GoldFunnelSettingsPage() {
  const [config, setConfig] = useState<Config>(defaultConfig)
  // Last-saved snapshot — diffed against `config` to drive the "unsaved
  // changes" bar. Null until the first successful load/save so the bar
  // never shows during the initial fetch.
  const [savedConfig, setSavedConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmingSave, setConfirmingSave] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    fetch('/api/admin/gold-funnel-config')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          const loaded: Config = {
            funnel_state: str(data.funnel_state, defaultConfig.funnel_state),
            headline: str(data.headline, defaultConfig.headline),
            subheadline: str(data.subheadline, defaultConfig.subheadline),
            offer_headline: str(data.offer_headline, defaultConfig.offer_headline),
            scarcity_copy: str(data.scarcity_copy, defaultConfig.scarcity_copy),
            cta_label: str(data.cta_label, defaultConfig.cta_label),
            confirmation_headline: str(data.confirmation_headline, defaultConfig.confirmation_headline),
            confirmation_body: str(data.confirmation_body, ''),
            call_booking_url: str(data.call_booking_url, defaultConfig.call_booking_url),
            invite_to_call_enabled: bool(data.invite_to_call_enabled, defaultConfig.invite_to_call_enabled),
          }
          setConfig(loaded)
          setSavedConfig(loaded)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const dirty = savedConfig !== null && JSON.stringify(config) !== JSON.stringify(savedConfig)

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/admin/gold-funnel-config', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config),
    })
    setSaving(false)
    setConfirmingSave(false)
    setSavedConfig(config)
    showToast('Funnel settings published')
  }

  const field = (key: keyof Omit<Config, 'funnel_state' | 'invite_to_call_enabled'>) => ({
    value: config[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setConfig(p => ({ ...p, [key]: e.target.value })),
  })

  if (loading) return (
    <div className="flex items-center justify-center min-h-full py-32">
      <Loader2 size={24} className="animate-spin text-[#c9a84c]" />
    </div>
  )

  return (
    <div className="dashboard-bg min-h-full">
      <div className={`max-w-2xl mx-auto px-6 md:px-8 py-8 space-y-6 page-enter ${dirty ? 'pb-28' : ''}`}>

        <div>
          <p className="section-label mb-1.5">Admin · Gold Desk</p>
          <h1 className="text-2xl font-light text-white tracking-tight">Funnel Settings</h1>
          <p className="text-[#5a5a66] text-sm mt-1 max-w-md">
            Controls the /dashboard/gold announcement page and application flow.
          </p>
        </div>

        {/* Funnel state */}
        <SectionCard title="Funnel State" icon={Shield} subtitle="Manually controlled — never changes automatically based on application volume.">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {FUNNEL_STATES.map(s => {
              const active = config.funnel_state === s.value
              const t = TONE[s.tone]
              return (
                <button key={s.value} onClick={() => setConfig(p => ({ ...p, funnel_state: s.value }))}
                  className="group relative text-left p-3.5 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                  style={active
                    ? { background: `linear-gradient(160deg, ${t.bg}, rgba(17,17,19,0.75))`, border: `1px solid ${t.border}`, boxShadow: `0 4px 18px ${t.bg}` }
                    : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <s.icon size={13} style={{ color: active ? t.fg : '#5a5a66' }} />
                    <span className="text-xs font-semibold" style={{ color: active ? t.fg : '#c7c7cf' }}>{s.label}</span>
                  </div>
                  <p className="text-[10.5px] leading-snug" style={{ color: active ? '#c7c7cf' : '#5a5a66' }}>{s.description}</p>
                </button>
              )
            })}
          </div>
        </SectionCard>

        {/* Call Booking */}
        <SectionCard title="Call Booking" icon={PhoneCall} subtitle="Powers the 'Invite To Call' action on an application — one shared booking link for all hosts.">
          <button onClick={() => setConfig(p => ({ ...p, invite_to_call_enabled: !p.invite_to_call_enabled }))}
            className="w-full flex items-center justify-between text-left p-3.5 rounded-xl transition-all duration-200"
            style={config.invite_to_call_enabled
              ? { background: `linear-gradient(160deg, ${TONE.gold.bg}, rgba(17,17,19,0.75))`, border: `1px solid ${TONE.gold.border}` }
              : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2">
              {config.invite_to_call_enabled ? <Unlock size={13} style={{ color: TONE.gold.fg }} /> : <Lock size={13} className="text-[#5a5a66]" />}
              <div>
                <p className="text-xs font-semibold" style={{ color: config.invite_to_call_enabled ? TONE.gold.fg : '#c7c7cf' }}>
                  Invite To Call {config.invite_to_call_enabled ? 'Enabled' : 'Disabled'}
                </p>
                <p className="text-[10.5px] leading-snug" style={{ color: config.invite_to_call_enabled ? '#c7c7cf' : '#5a5a66' }}>
                  {config.invite_to_call_enabled ? 'Admins can invite applicants to a call.' : 'The Invite To Call button is locked on every application.'}
                </p>
              </div>
            </div>
          </button>

          <Field label="Calendly Booking Link" span="full" placeholder="https://calendly.com/…" {...field('call_booking_url')} />
        </SectionCard>

        {/* Edit Page */}
        <SectionCard title="Edit Page" icon={PenLine} subtitle="The headline, offer, and CTA shown on /dashboard/gold before someone applies.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Headline" span="full" {...field('headline')} />
            <Field label="Subheadline" span="full" {...field('subheadline')} />
            <Field label="Offer Headline" {...field('offer_headline')} />
            <Field label="CTA Label" {...field('cta_label')} />
            <Field label="Scarcity Copy" span="full" placeholder="Marketing only — no capacity limit tied to it" {...field('scarcity_copy')} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#5a5a66] font-semibold">
              <CheckCircle2 size={11} /> After They Apply
            </span>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Confirmation Headline" span="full" {...field('confirmation_headline')} />
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#3a3a42] mb-1.5">Confirmation Body</label>
              <textarea value={config.confirmation_body}
                onChange={e => setConfig(p => ({ ...p, confirmation_body: e.target.value }))}
                rows={3} className="input-dark w-full text-sm resize-none" />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Sticky save bar — only appears once something's actually changed. */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-center gap-4"
          style={{ background: 'rgba(10,10,11,0.92)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[#e0c26e] text-xs font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: '#e0c26e' }} />
            Unsaved changes
          </p>
          <button onClick={() => setConfirmingSave(true)} disabled={saving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))', border: '1px solid rgba(201,168,76,0.32)', color: '#e0c26e', boxShadow: '0 4px 20px rgba(201,168,76,0.12)' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Funnel Settings
          </button>
        </div>
      )}

      {confirmingSave && (
        <ConfirmDialog busy={saving} onConfirm={handleSave} onCancel={() => setConfirmingSave(false)} />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium z-50"
          style={{ background: 'rgba(17,17,19,0.98)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <CheckCircle2 size={14} />
          {toast}
        </div>
      )}
    </div>
  )
}
