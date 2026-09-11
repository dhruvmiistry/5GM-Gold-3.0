'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Loader2, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck, ClipboardCheck, Search, Sparkles,
} from 'lucide-react'

type Step = 'details' | 'phone' | 'profile' | 'questions' | 'review' | 'done'
const STEP_ORDER: Step[] = ['details', 'phone', 'profile', 'questions', 'review']

const MARKETS = ['Forex', 'Futures', 'Indices', 'Crypto', 'Other']
const EXPERIENCE_OPTIONS = ['Less than 6 months', '6–12 months', '1–2 years', '2–4 years', '4+ years']
const LEVEL_OPTIONS = ['Beginner', 'Developing', 'Breakeven', 'Profitable', 'Funded trader', 'Trading personal capital']
const COMMITMENT_OPTIONS = ['Fully committed', 'Very serious', 'Exploring my options', 'Just curious']
const EMPLOYMENT_OPTIONS = ['Employed full-time', 'Employed part-time', 'Self-employed / business owner', 'Student', 'Between jobs', 'Retired']
const LIFETIME_MEMBERSHIP_OPTIONS = ['5GM Academy', "AB's Mentorship"]

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand', 'Ireland',
  'South Africa', 'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal',
  'Germany', 'France', 'Spain', 'Italy', 'Portugal', 'Netherlands', 'Belgium',
  'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland',
  'Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Greece',
  'Croatia', 'Serbia', 'Ukraine', 'Russia', 'Turkey', 'Cyprus', 'Malta', 'Luxembourg',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan',
  'Israel', 'Lebanon', 'Egypt', 'Morocco', 'Algeria', 'Tunisia', 'Nigeria', 'Kenya',
  'Ghana', 'Ethiopia', 'Tanzania', 'Uganda', 'Zimbabwe', 'Zambia',
  'China', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Indonesia', 'Thailand',
  'Philippines', 'Vietnam', 'Hong Kong', 'Taiwan',
  'Mexico', 'Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Ecuador',
  'Other',
]

const DIAL_CODES = [
  { code: '+1', abbr: 'US/CA' },
  { code: '+44', abbr: 'UK' },
  { code: '+61', abbr: 'AU' },
  { code: '+64', abbr: 'NZ' },
  { code: '+353', abbr: 'IE' },
  { code: '+27', abbr: 'ZA' },
  { code: '+91', abbr: 'IN' },
  { code: '+92', abbr: 'PK' },
  { code: '+880', abbr: 'BD' },
  { code: '+94', abbr: 'LK' },
  { code: '+977', abbr: 'NP' },
  { code: '+49', abbr: 'DE' },
  { code: '+33', abbr: 'FR' },
  { code: '+34', abbr: 'ES' },
  { code: '+39', abbr: 'IT' },
  { code: '+351', abbr: 'PT' },
  { code: '+31', abbr: 'NL' },
  { code: '+32', abbr: 'BE' },
  { code: '+41', abbr: 'CH' },
  { code: '+43', abbr: 'AT' },
  { code: '+46', abbr: 'SE' },
  { code: '+47', abbr: 'NO' },
  { code: '+45', abbr: 'DK' },
  { code: '+358', abbr: 'FI' },
  { code: '+354', abbr: 'IS' },
  { code: '+48', abbr: 'PL' },
  { code: '+420', abbr: 'CZ' },
  { code: '+421', abbr: 'SK' },
  { code: '+36', abbr: 'HU' },
  { code: '+40', abbr: 'RO' },
  { code: '+359', abbr: 'BG' },
  { code: '+30', abbr: 'GR' },
  { code: '+385', abbr: 'HR' },
  { code: '+381', abbr: 'RS' },
  { code: '+380', abbr: 'UA' },
  { code: '+7', abbr: 'RU' },
  { code: '+90', abbr: 'TR' },
  { code: '+357', abbr: 'CY' },
  { code: '+356', abbr: 'MT' },
  { code: '+352', abbr: 'LU' },
  { code: '+971', abbr: 'AE' },
  { code: '+966', abbr: 'SA' },
  { code: '+974', abbr: 'QA' },
  { code: '+965', abbr: 'KW' },
  { code: '+973', abbr: 'BH' },
  { code: '+968', abbr: 'OM' },
  { code: '+962', abbr: 'JO' },
  { code: '+972', abbr: 'IL' },
  { code: '+961', abbr: 'LB' },
  { code: '+20', abbr: 'EG' },
  { code: '+212', abbr: 'MA' },
  { code: '+213', abbr: 'DZ' },
  { code: '+216', abbr: 'TN' },
  { code: '+234', abbr: 'NG' },
  { code: '+254', abbr: 'KE' },
  { code: '+233', abbr: 'GH' },
  { code: '+251', abbr: 'ET' },
  { code: '+255', abbr: 'TZ' },
  { code: '+256', abbr: 'UG' },
  { code: '+263', abbr: 'ZW' },
  { code: '+260', abbr: 'ZM' },
  { code: '+86', abbr: 'CN' },
  { code: '+81', abbr: 'JP' },
  { code: '+82', abbr: 'KR' },
  { code: '+65', abbr: 'SG' },
  { code: '+60', abbr: 'MY' },
  { code: '+62', abbr: 'ID' },
  { code: '+66', abbr: 'TH' },
  { code: '+63', abbr: 'PH' },
  { code: '+84', abbr: 'VN' },
  { code: '+852', abbr: 'HK' },
  { code: '+886', abbr: 'TW' },
  { code: '+52', abbr: 'MX' },
  { code: '+55', abbr: 'BR' },
  { code: '+54', abbr: 'AR' },
  { code: '+56', abbr: 'CL' },
  { code: '+57', abbr: 'CO' },
  { code: '+51', abbr: 'PE' },
  { code: '+58', abbr: 'VE' },
  { code: '+593', abbr: 'EC' },
]

function logEvent(eventType: string) {
  fetch('/api/gold/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType }) }).catch(() => {})
}

interface ExistingApplication {
  id: string
  status: string
  submitted_at: string
}

export default function GoldApplyPage() {
  const { user } = useAuth()
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [existing, setExisting] = useState<ExistingApplication | null>(null)
  const [step, setStep] = useState<Step>('details')

  // Step 1 — details
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [isOver18, setIsOver18] = useState(false)

  // Step 2 — phone number (collected, not verified — no SMS/OTP step)
  const [dialCode, setDialCode] = useState(DIAL_CODES[0].code)
  const [phoneNumber, setPhoneNumber] = useState('')

  // Step 3 — trading profile
  const [tradingExperience, setTradingExperience] = useState('')
  const [marketsTraded, setMarketsTraded] = useState<string[]>([])
  const [tradingLevel, setTradingLevel] = useState('')
  const [propFirmFunded, setPropFirmFunded] = useState(false)
  const [fundedCapital, setFundedCapital] = useState('')
  const [personalAccount, setPersonalAccount] = useState(false)
  const [biggestChallenge, setBiggestChallenge] = useState('')

  // Step 4 — application questions
  const [whyJoin, setWhyJoin] = useState('')
  const [programmeGoal, setProgrammeGoal] = useState('')
  const [currentObstacle, setCurrentObstacle] = useState('')
  const [commitmentLevel, setCommitmentLevel] = useState('')
  const [employmentStatus, setEmploymentStatus] = useState('')
  const [twelveMonthGoal, setTwelveMonthGoal] = useState('')
  const [lifetimeMemberships, setLifetimeMemberships] = useState<string[]>([])
  const [additionalInformation, setAdditionalInformation] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) { setFullName(user.name); setEmail(user.email) }
  }, [user])

  useEffect(() => {
    fetch('/api/gold/applications')
      .then(r => r.json())
      .then(d => { setExisting(d ?? null); setCheckingExisting(false); if (!d) logEvent('application_started') })
      .catch(() => setCheckingExisting(false))
  }, [])

  const toggleMarket = (m: string) => setMarketsTraded(prev => (prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]))
  const toggleLifetimeMembership = (m: string) => setLifetimeMemberships(prev => (prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]))

  const fullPhoneNumber = `${dialCode} ${phoneNumber.trim()}`

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/gold/applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName, email, phoneNumber: fullPhoneNumber, country, isOver18,
        tradingExperience, marketsTraded, tradingLevel, propFirmFunded, fundedCapital, personalAccount, biggestChallenge,
        whyJoin, programmeGoal, currentObstacle, commitmentLevel, employmentStatus, twelveMonthGoal, lifetimeMemberships, additionalInformation,
      }),
    })
    setSubmitting(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Submission failed'); return }
    setStep('done')
  }

  if (checkingExisting) {
    return (
      <div className="dashboard-bg min-h-full flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
      </div>
    )
  }

  if (existing && !['rejected', 'archived'].includes(existing.status)) {
    return <AlreadyApplied status={existing.status} />
  }

  if (step === 'done') return <Confirmation />

  const canContinue: Record<Step, boolean> = {
    details: !!fullName && !!email && !!country && isOver18,
    phone: phoneNumber.replace(/\D/g, '').length >= 6,
    profile: !!tradingExperience && !!tradingLevel,
    questions: !!whyJoin && !!programmeGoal && !!currentObstacle && !!commitmentLevel && !!employmentStatus && !!twelveMonthGoal,
    review: true,
    done: true,
  }

  const stepIndex = STEP_ORDER.indexOf(step)
  const goNext = () => { const i = STEP_ORDER.indexOf(step); if (i < STEP_ORDER.length - 1) setStep(STEP_ORDER[i + 1]) }
  const goBack = () => { const i = STEP_ORDER.indexOf(step); if (i > 0) setStep(STEP_ORDER[i - 1]) }

  return (
    <div className="dashboard-bg min-h-full relative overflow-hidden">
      <div className="absolute -top-24 right-[-15%] w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="relative max-w-xl mx-auto px-6 md:px-8 py-8 md:py-12 space-y-7">

        {/* Header + progress */}
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-1.5 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)', filter: 'blur(6px)' }} />
              <div className="relative w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)' }}>
                <ShieldCheck size={15} className="text-black" strokeWidth={2.25} />
              </div>
            </div>
            <div>
              <p className="section-label">Week 1 Application</p>
              <h1 className="text-[1.5rem] font-light text-white tracking-tight leading-snug">Apply For 5GM Gold</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {STEP_ORDER.map((s, i) => (
              <div key={s} className="flex-1 h-1.5 rounded-full transition-all"
                style={{
                  background: i <= stepIndex ? 'linear-gradient(90deg, #b8932e, #e8c96d)' : 'rgba(255,255,255,0.08)',
                  boxShadow: i <= stepIndex ? '0 0 8px rgba(201,168,76,0.5)' : 'none',
                }} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className="relative p-6 rounded-2xl space-y-5 overflow-hidden"
            style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(201,168,76,0.14)', boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(201,168,76,0.06)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(201,168,76,0.4) 50%, transparent 90%)' }} />

            {step === 'details' && (
              <>
                <h2 className="text-white font-medium">Basic Details</h2>
                <Field label="Full name">
                  <input value={fullName} onChange={e => setFullName(e.target.value)} className="input-dark w-full text-sm" />
                </Field>
                <Field label="Email">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-dark w-full text-sm" />
                </Field>
                <Field label="Country">
                  <Select value={country} onChange={setCountry} options={COUNTRIES} />
                </Field>
                <label className="flex items-center gap-2.5 text-sm text-[#8e8e9a] cursor-pointer">
                  <input type="checkbox" checked={isOver18} onChange={e => setIsOver18(e.target.checked)} className="w-4 h-4 accent-[#c9a84c]" />
                  I confirm I am 18 years of age or older
                </label>
              </>
            )}

            {step === 'phone' && (
              <>
                <h2 className="text-white font-medium">Phone Number</h2>
                <p className="text-[#5a5a66] text-xs">So the 5GM team can reach you if your application moves forward.</p>
                <Field label="Country code">
                  <select value={dialCode} onChange={e => setDialCode(e.target.value)} className="input-dark w-full text-sm">
                    {DIAL_CODES.map(d => <option key={d.code + d.abbr} value={d.code}>{d.code} — {d.abbr}</option>)}
                  </select>
                </Field>
                <Field label="Phone number">
                  <input
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/[^\d ]/g, ''))}
                    inputMode="numeric"
                    placeholder="555 000 0000"
                    className="input-dark w-full text-sm"
                  />
                </Field>
              </>
            )}

            {step === 'profile' && (
              <>
                <h2 className="text-white font-medium">Trading Profile</h2>
                <Field label="How long have you been trading?">
                  <Select value={tradingExperience} onChange={setTradingExperience} options={EXPERIENCE_OPTIONS} />
                </Field>
                <Field label="What markets do you currently trade?">
                  <div className="flex flex-wrap gap-2">
                    {MARKETS.map(m => (
                      <button key={m} onClick={() => toggleMarket(m)} type="button"
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={marketsTraded.includes(m)
                          ? { background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', color: '#e8c96d' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8e8e9a' }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="How would you describe your current level?">
                  <Select value={tradingLevel} onChange={setTradingLevel} options={LEVEL_OPTIONS} />
                </Field>
                <label className="flex items-center gap-2.5 text-sm text-[#8e8e9a] cursor-pointer">
                  <input type="checkbox" checked={propFirmFunded} onChange={e => setPropFirmFunded(e.target.checked)} className="w-4 h-4 accent-[#c9a84c]" />
                  I am currently funded by a prop firm
                </label>
                {propFirmFunded && (
                  <Field label="Approximate funded capital">
                    <input value={fundedCapital} onChange={e => setFundedCapital(e.target.value)} placeholder="e.g. $50,000" className="input-dark w-full text-sm" />
                  </Field>
                )}
                <label className="flex items-center gap-2.5 text-sm text-[#8e8e9a] cursor-pointer">
                  <input type="checkbox" checked={personalAccount} onChange={e => setPersonalAccount(e.target.checked)} className="w-4 h-4 accent-[#c9a84c]" />
                  I currently trade a personal account
                </label>
                <Field label="What is the biggest challenge in your trading right now?">
                  <textarea value={biggestChallenge} onChange={e => setBiggestChallenge(e.target.value)} rows={3} className="input-dark w-full text-sm resize-none" />
                </Field>
              </>
            )}

            {step === 'questions' && (
              <>
                <h2 className="text-white font-medium">A Few Questions</h2>
                <Field label="Why do you want to join Week 1 of 5GM Gold?">
                  <textarea value={whyJoin} onChange={e => setWhyJoin(e.target.value)} rows={3} className="input-dark w-full text-sm resize-none" />
                </Field>
                <Field label="What are you hoping to achieve through the full 12-week programme?">
                  <textarea value={programmeGoal} onChange={e => setProgrammeGoal(e.target.value)} rows={3} className="input-dark w-full text-sm resize-none" />
                </Field>
                <Field label="What is currently preventing you from reaching the next level in your trading?">
                  <textarea value={currentObstacle} onChange={e => setCurrentObstacle(e.target.value)} rows={3} className="input-dark w-full text-sm resize-none" />
                </Field>
                <Field label="How seriously are you prepared to commit if accepted?">
                  <Select value={commitmentLevel} onChange={setCommitmentLevel} options={COMMITMENT_OPTIONS} />
                </Field>
                <Field label="What is your current employment situation?">
                  <Select value={employmentStatus} onChange={setEmploymentStatus} options={EMPLOYMENT_OPTIONS} />
                </Field>
                <Field label="Where would you like your trading to be 12 months from now?">
                  <textarea value={twelveMonthGoal} onChange={e => setTwelveMonthGoal(e.target.value)} rows={3} className="input-dark w-full text-sm resize-none" />
                </Field>
                <Field label="Are you a lifetime member of 5GM Academy or AB's Mentorship?">
                  <div className="flex flex-wrap gap-2">
                    {LIFETIME_MEMBERSHIP_OPTIONS.map(m => (
                      <button key={m} onClick={() => toggleLifetimeMembership(m)} type="button"
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={lifetimeMemberships.includes(m)
                          ? { background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', color: '#e8c96d' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8e8e9a' }}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="text-[#5a5a66] text-xs mt-1.5">Select all that apply, or leave blank if neither. Lifetime members may be eligible for an additional incentive.</p>
                </Field>
                <Field label="Anything else the 5GM team should know? (optional)">
                  <textarea value={additionalInformation} onChange={e => setAdditionalInformation(e.target.value)} rows={2} className="input-dark w-full text-sm resize-none" />
                </Field>
              </>
            )}

            {step === 'review' && (
              <>
                <h2 className="text-white font-medium">Review &amp; Submit</h2>
                <div className="space-y-2.5">
                  {[
                    ['Name', fullName], ['Email', email], ['Country', country],
                    ['Phone', fullPhoneNumber], ['Experience', tradingExperience],
                    ['Markets', marketsTraded.join(', ') || '—'], ['Level', tradingLevel],
                    ['Commitment', commitmentLevel],
                    ['Lifetime member', lifetimeMemberships.join(', ') || 'No'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-4 text-sm">
                      <span className="text-[#5a5a66] text-xs uppercase tracking-wide shrink-0">{label}</span>
                      <span className="text-white text-right">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[#8e8e9a] text-xs leading-relaxed pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  Your application will be reviewed by the 5GM team. If we believe the programme is a suitable fit,
                  a member of the team will contact you with the next step.
                </p>
                {error && <p className="text-red-400 text-xs flex items-center gap-1.5"><AlertCircle size={12} /> {error}</p>}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <button onClick={goBack} className="px-4 py-3 rounded-xl text-sm font-medium text-[#8e8e9a]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Back
            </button>
          )}
          {step === 'review' ? (
            <button onClick={submit} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-black transition-all hover:scale-[1.015] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)', boxShadow: '0 8px 28px rgba(201,168,76,0.32)' }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              Submit Application
            </button>
          ) : (
            <button onClick={goNext} disabled={!canContinue[step]}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-black transition-all hover:scale-[1.015] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)', boxShadow: '0 8px 28px rgba(201,168,76,0.32)' }}>
              Continue <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-widest text-[#9a9aa6] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="input-dark w-full text-sm">
      <option value="" disabled>Select…</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

const STATUS_META: Record<string, { label: string; description: string }> = {
  new: { label: 'Submitted', description: 'Your application is in the queue, waiting to be picked up.' },
  reviewing: { label: 'Under Review', description: 'A member of the 5GM team is reviewing your application right now.' },
  qualified: { label: 'Qualified', description: 'You’ve been shortlisted. The team will be in touch with next steps shortly.' },
  invited_to_call: { label: 'Call Invited', description: 'You’ve been invited to a call — check your email and phone.' },
  accepted_week_one: { label: 'Accepted', description: 'You’re in. Welcome to Week 1.' },
  enrolled: { label: 'Enrolled', description: 'You’re enrolled in the full 12-week programme.' },
}

const TRACKER_STEPS = [
  { key: 'submitted', label: 'Submitted', icon: ClipboardCheck },
  { key: 'review', label: 'In Review', icon: Search },
  { key: 'decision', label: 'Decision', icon: Sparkles },
] as const

// Maps the DB status onto a 0/1/2 tracker index — 'new' and 'reviewing' both
// read as "In Review" from the applicant's side, anything past that (qualified,
// invited_to_call, accepted_week_one, enrolled) means a decision has landed.
function trackerIndex(status: string) {
  if (status === 'new' || status === 'reviewing') return 1
  return 2
}

// Uber-Eats-style status tracker — no promised turnaround time, just a live
// read on where the application actually sits in the pipeline.
function StatusTracker({ status }: { status: string }) {
  const activeIndex = trackerIndex(status)
  return (
    <div className="flex items-start">
      {TRACKER_STEPS.map((step, i) => {
        const done = i < activeIndex
        const active = i === activeIndex
        const Icon = step.icon
        return (
          <div key={step.key} className={`flex items-center ${i < TRACKER_STEPS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={done || active
                  ? { background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)', boxShadow: '0 0 16px rgba(201,168,76,0.35)' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#e8c96d] pulse-glow" />
                )}
                {done
                  ? <CheckCircle2 size={15} className="text-black" strokeWidth={2.5} />
                  : <Icon size={14} className={active ? 'text-black' : 'text-[#5a5a66]'} strokeWidth={2} />}
              </div>
              <span className={`text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap ${done || active ? 'text-[#c9a84c]' : 'text-[#3a3a46]'}`}>
                {step.label}
              </span>
            </div>
            {i < TRACKER_STEPS.length - 1 && (
              <div className="flex-1 h-[2px] rounded-full mx-1 -mt-4"
                style={{ background: i < activeIndex ? 'linear-gradient(90deg, #b8932e, #e8c96d)' : 'rgba(255,255,255,0.08)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function LiveStatus({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.new
  const isPending = status === 'new' || status === 'reviewing'
  return (
    <div className="space-y-4">
      <StatusTracker status={status} />
      <p className="text-[#8e8e9a] text-sm leading-relaxed">{meta.description}</p>
      {isPending && <p className="text-[#3a3a46] text-[11px]">Most applications are reviewed within 24 hours.</p>}
    </div>
  )
}

function AlreadyApplied({ status }: { status: string }) {
  return (
    <div className="dashboard-bg min-h-full flex items-center justify-center py-24 px-6">
      <div className="max-w-sm text-center space-y-4">
        <div className="relative w-11 h-11 mx-auto">
          <div className="absolute -inset-3 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.2) 0%, transparent 70%)', filter: 'blur(10px)' }} />
          <div className="relative w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)' }}>
            <ShieldCheck size={18} className="text-black" strokeWidth={2} />
          </div>
        </div>
        <h1 className="text-white text-lg font-medium">Application In Progress</h1>
        <LiveStatus status={status} />
      </div>
    </div>
  )
}

function Confirmation() {
  return (
    <div className="dashboard-bg min-h-full flex items-center justify-center py-24 px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-sm text-center space-y-5">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute -inset-4 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.28) 0%, transparent 70%)', filter: 'blur(12px)' }} />
          <div className="relative w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)' }}>
            <CheckCircle2 size={20} className="text-black" strokeWidth={2} />
          </div>
        </div>
        <h1 className="text-white text-xl font-light">Application Received</h1>
        <LiveStatus status="new" />
      </motion.div>
    </div>
  )
}
