'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import StaffNotes from '@/components/mentorCalls/StaffNotes'
import {
  ArrowLeft, Loader2, ChevronDown, RotateCcw, Send, Trash2,
  Inbox, PhoneCall, CheckCircle2, XCircle, Lock, type LucideIcon,
} from 'lucide-react'

type Application = {
  id: string; user_id: string; full_name: string; email: string; phone_number: string
  country: string | null; is_over_18: boolean
  trading_experience: string | null; markets_traded: string[]; trading_level: string | null
  prop_firm_funded: boolean; funded_capital: string | null; personal_account: boolean; biggest_challenge: string | null
  why_join: string | null; programme_goal: string | null; current_obstacle: string | null
  commitment_level: string | null; employment_status: string | null
  twelve_month_goal: string | null; lifetime_memberships: string[]; additional_information: string | null
  status: string; qualification_score: number | null
  submitted_at: string; reviewed_at: string | null
  applicant: { full_name: string | null; email: string | null; created_at: string; plan: string } | null
  courseProgress: { progressPercentage: number; completedCount: number } | null
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: 'text-[#8e8e9a] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',
    reviewing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    qualified: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    invited_to_call: 'text-[#c9a84c] bg-[rgba(201,168,76,0.1)] border-[rgba(201,168,76,0.25)]',
    accepted_week_one: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
    enrolled: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    archived: 'text-[#5a5a66] bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)]',
  }
  return <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${map[status] ?? map.new}`}>{status.replace(/_/g, ' ')}</span>
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-[#5a5a66] text-xs uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-white text-right">{value ?? '—'}</span>
    </div>
  )
}

// The 4 real decision points — "Mark Reviewing" and "Qualify" aren't
// separate buttons: reviewing is implicit (an admin has the record open)
// and qualifying is the same call as inviting to the call.
const DECISIONS: { action: string; label: string; status: string; tone: 'gold' | 'positive' | 'danger' | 'neutral'; confirm: string }[] = [
  { action: 'invite_to_call', label: 'Invite To Call', status: 'invited_to_call', tone: 'gold', confirm: 'Send this applicant the private call booking link by email?' },
  { action: 'accept_week_one', label: 'Accept Week 1', status: 'accepted_week_one', tone: 'positive', confirm: 'Accept this applicant into Week 1 and notify them by email?' },
  { action: 'reject', label: 'Reject', status: 'rejected', tone: 'danger', confirm: 'Reject this application? The applicant will be notified by email.' },
  { action: 'archive', label: 'Archive', status: 'archived', tone: 'neutral', confirm: 'Archive this application? No email is sent.' },
]

const INVITE_LOCK_TOOLTIP = 'Locked until the call booking backend is ready — enable it in Gold Desk Settings.'

function DecisionButton({ label, tone, disabled, busy, locked, onClick }: {
  label: string; tone: 'gold' | 'positive' | 'danger' | 'neutral'; disabled: boolean; busy: boolean; locked?: boolean; onClick: () => void
}) {
  const style = locked
    ? { color: '#4a4a54', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }
    : disabled
    ? { color: '#4a4a54', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }
    : tone === 'gold'
    ? { color: '#0a0a0b', background: '#c9a84c', boxShadow: '0 4px 16px rgba(201,168,76,0.2)' }
    : tone === 'positive'
    ? { color: '#4caf7d', background: 'rgba(76,175,125,0.08)', border: '1px solid rgba(76,175,125,0.22)' }
    : tone === 'danger'
    ? { color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)' }
    : { color: '#8e8e9a', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
  return (
    <button onClick={onClick} disabled={disabled || busy} title={locked ? INVITE_LOCK_TOOLTIP : undefined}
      className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2.5 rounded-xl transition-all disabled:cursor-not-allowed"
      style={style}>
      {locked ? <Lock size={11} /> : busy && <Loader2 size={12} className="animate-spin" />}
      {label}
    </button>
  )
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: 'rgba(17,17,19,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="section-label">{title}</p>
        {right}
      </div>
      {children}
    </div>
  )
}

type EmailJob = { id: string; type: string; status: string; attempts: number; last_error: string | null; created_at: string; sent_at: string | null }

// Mirrors the 4 types gold_application_notification_jobs accepts (see
// migration 019) — one card per type, always, whether or not it's been sent.
const EMAIL_TYPES: { type: string; label: string; blurb: string; icon: LucideIcon }[] = [
  { type: 'received', label: 'Application Received', blurb: 'Confirms their application landed', icon: Inbox },
  { type: 'invited_to_call', label: 'Invited To Call', blurb: 'Sends the private booking link', icon: PhoneCall },
  { type: 'accepted_week_one', label: 'Accepted — Week 1', blurb: 'Welcomes them into the programme', icon: CheckCircle2 },
  { type: 'rejected', label: 'Rejected', blurb: 'Politely closes out the application', icon: XCircle },
]

const EMAIL_TONE: Record<string, { fg: string; bg: string; border: string }> = {
  sent: { fg: '#4caf7d', bg: 'rgba(76,175,125,0.1)', border: 'rgba(76,175,125,0.22)' },
  pending: { fg: '#c9a84c', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.25)' },
  failed: { fg: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)' },
  skipped: { fg: '#8e8e9a', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  none: { fg: '#5a5a66', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)' },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatRelative(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function EmailStatusBadge({ status }: { status: keyof typeof EMAIL_TONE }) {
  const tone = EMAIL_TONE[status]
  const label = status === 'none' ? 'not sent' : status
  return (
    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0"
      style={{ color: tone.fg, background: tone.bg, borderColor: tone.border }}>
      {label}
    </span>
  )
}

function EmailCard({ label, blurb, icon: Icon, job, busy, locked, onSend }: {
  label: string; blurb: string; icon: LucideIcon; job: EmailJob | undefined; busy: boolean; locked?: boolean; onSend: () => void
}) {
  const status = (job?.status ?? 'none') as keyof typeof EMAIL_TONE
  const tone = EMAIL_TONE[status]

  const statusText = locked ? 'Locked — booking backend not ready'
    : !job ? blurb
    : job.status === 'sent' && job.sent_at ? `Sent ${formatRelative(job.sent_at)}`
    : job.status === 'pending' ? 'Queued — sending shortly'
    : job.status === 'failed' ? 'Send failed — see below'
    : job.status === 'skipped' ? (job.last_error ?? 'Skipped')
    : job.status

  return (
    <div className="relative p-4 rounded-xl transition-all hover:border-[rgba(255,255,255,0.14)]"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: tone.bg }}>
            <Icon size={16} style={{ color: tone.fg }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{label}</p>
            <p className="text-[11px] text-[#5a5a66] truncate" title={job?.sent_at ? formatDateTime(job.sent_at) : undefined}>{statusText}</p>
          </div>
        </div>
        <EmailStatusBadge status={status} />
      </div>

      {job?.status === 'failed' && job.last_error && (
        <p className="text-[11px] text-red-400/80 leading-relaxed mb-3 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)' }}>
          {job.last_error}
        </p>
      )}

      <button onClick={onSend} disabled={busy || locked} title={locked ? INVITE_LOCK_TOOLTIP : undefined}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: '#c7c7cf', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {locked ? <Lock size={11} /> : busy ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
        {locked ? 'Locked' : status === 'sent' ? 'Resend' : 'Send now'}
      </button>
    </div>
  )
}

export default function AdminApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [app, setApp] = useState<Application | null>(null)
  const [emails, setEmails] = useState<EmailJob[]>([])
  const [loading, setLoading] = useState(true)
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [scoreOpen, setScoreOpen] = useState(false)
  const [confirming, setConfirming] = useState<{ run: () => Promise<void>; message: string } | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  // Defaults locked (false) if the key is missing entirely — e.g. migration
  // 022 not applied yet — same fail-safe the server-side checks use.
  const [inviteToCallEnabled, setInviteToCallEnabled] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/applications?id=${id}`).then(r => r.json()),
      fetch(`/api/admin/applications/${id}/emails`).then(r => r.json()),
      fetch(`/api/admin/gold-funnel-config`).then(r => r.json()),
    ]).then(([appData, emailData, configData]) => {
      setApp(appData)
      setEmails(Array.isArray(emailData) ? emailData : [])
      setInviteToCallEnabled(configData?.invite_to_call_enabled === true)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const performAction = async (action: string, extra: Record<string, unknown> = {}) => {
    setActionBusy(action)
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }),
    })
    setActionBusy(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Action failed'); return }
    showToast('Updated')
    load()
  }

  const deleteApplication = async () => {
    setActionBusy('delete')
    const res = await fetch(`/api/admin/applications/${id}`, { method: 'DELETE' })
    setActionBusy(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Delete failed'); return }
    router.push('/admin/applications')
  }

  const sendEmail = async (type: string) => {
    setActionBusy(`email:${type}`)
    const res = await fetch(`/api/admin/applications/${id}/emails`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }),
    })
    setActionBusy(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || 'Send failed'); return }
    showToast('Email sent')
    load()
  }

  // Score/assign apply immediately — every status change and every email
  // send goes through this confirm step first, since both reach the
  // applicant's inbox and a stray click shouldn't be able to send one.
  const requestAction = (run: () => Promise<void>, message: string) => setConfirming({ run, message })

  const confirmAndRun = async () => {
    if (!confirming) return
    setConfirmBusy(true)
    await confirming.run()
    setConfirmBusy(false)
    setConfirming(null)
  }

  if (loading || !app) {
    return (
      <div className="dashboard-bg min-h-full flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
      </div>
    )
  }

  const totalLessons = 20

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-8 space-y-6">

        <button onClick={() => router.push('/admin/applications')} className="flex items-center gap-1.5 text-[#5a5a66] hover:text-white text-xs transition-colors">
          <ArrowLeft size={13} /> Back to Applications
        </button>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="section-label mb-1.5">Application</p>
            <h1 className="text-2xl font-light text-white tracking-tight">{app.full_name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {app.lifetime_memberships?.length > 0 && (
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border text-[#c9a84c] bg-[rgba(201,168,76,0.1)] border-[rgba(201,168,76,0.25)]"
                title={`Lifetime member: ${app.lifetime_memberships.join(', ')}`}>
                Lifetime member
              </span>
            )}
            <StatusBadge status={app.status} />
          </div>
        </div>

        {/* Admin actions — 4 fixed decision buttons, always in the same
            place regardless of status (disabled once already reached), plus
            a low-key Revert for mis-clicks. Every status change is confirmed
            via ConfirmDialog before it fires — Invite/Accept/Reject email
            the applicant, so a stray click shouldn't be able to send one. */}
        <Section title="Actions">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {DECISIONS.map(d => {
                const locked = d.action === 'invite_to_call' && !inviteToCallEnabled
                return (
                  <DecisionButton key={d.action} label={d.label} tone={d.tone} locked={locked}
                    disabled={app.status === d.status || locked} busy={actionBusy === d.action}
                    onClick={() => requestAction(() => performAction(d.action, {}), d.confirm)} />
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              {app.status !== 'new' && app.status !== 'reviewing' && (
                <button onClick={() => requestAction(() => performAction('revert', {}), `Move this application back to Reviewing? This clears its "${app.status.replace(/_/g, ' ')}" status. No email is sent.`)}
                  disabled={actionBusy === 'revert'}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#5a5a66] hover:text-white transition-colors disabled:opacity-50">
                  {actionBusy === 'revert' ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                  Change back
                </button>
              )}

              <div className="relative">
                <button onClick={() => setScoreOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-[#8e8e9a] transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Score <span className="text-[#c9a84c] font-semibold">{app.qualification_score ?? '—'}</span>
                  <ChevronDown size={12} />
                </button>
                {scoreOpen && (
                  <div className="absolute right-0 z-10 mt-1 p-2 rounded-xl grid grid-cols-5 gap-1" style={{ background: 'rgba(10,10,11,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => { setScoreOpen(false); performAction('score', { score: n }) }}
                        className="w-8 h-8 rounded-lg text-xs font-medium text-[#8e8e9a] hover:bg-[rgba(201,168,76,0.12)] hover:text-[#c9a84c] transition-all">
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* Emails — one card per notification type this application can
            receive, showing the same job gold_application_notification_jobs
            would show whether it was sent automatically (a status change)
            or manually here. Send/Resend always fires immediately rather
            than waiting on the cron sweep. */}
        <Section title="Emails" right={
          <span className="text-[11px] font-medium text-[#5a5a66]">
            <span className="text-[#c9a84c]">{emails.filter(e => e.status === 'sent').length}</span> / {EMAIL_TYPES.length} sent
          </span>
        }>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EMAIL_TYPES.map(({ type, label, blurb, icon }) => {
              const locked = type === 'invited_to_call' && !inviteToCallEnabled
              return (
                <EmailCard key={type} label={label} blurb={blurb} icon={icon} job={emails.find(e => e.type === type)}
                  busy={actionBusy === `email:${type}`} locked={locked}
                  onSend={() => requestAction(() => sendEmail(type), `Send the "${label}" email to ${app.email} now?`)} />
              )
            })}
          </div>
        </Section>

        {/* Applicant */}
        <Section title="Applicant">
          <Row label="Full name" value={app.full_name} />
          <Row label="Email" value={app.email} />
          <Row label="Phone" value={app.phone_number} />
          <Row label="Country" value={app.country} />
          <Row label="Lifetime member" value={app.lifetime_memberships?.length ? app.lifetime_memberships.join(', ') : 'No'} />
          <Row label="Member account" value={
            <Link href={`/admin/users/${app.user_id}`} className="text-[#c9a84c] hover:text-[#e8c96d] transition-colors">View profile</Link>
          } />
          <Row label="Joined platform" value={app.applicant?.created_at ? new Date(app.applicant.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
          <Row label="Applied" value={new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
          {app.courseProgress && (
            <Row label="The Reset progress" value={`${app.courseProgress.progressPercentage}% · ${app.courseProgress.completedCount}/${totalLessons} lessons`} />
          )}
        </Section>

        {/* Trading profile */}
        <Section title="Trading Profile">
          <Row label="Experience" value={app.trading_experience} />
          <Row label="Markets traded" value={app.markets_traded?.join(', ')} />
          <Row label="Level" value={app.trading_level} />
          <Row label="Prop firm funded" value={app.prop_firm_funded ? `Yes${app.funded_capital ? ` (${app.funded_capital})` : ''}` : 'No'} />
          <Row label="Trades personal account" value={app.personal_account ? 'Yes' : 'No'} />
          {app.biggest_challenge && (
            <div className="pt-3">
              <p className="text-[#5a5a66] text-xs uppercase tracking-wide mb-1.5">Biggest challenge</p>
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{app.biggest_challenge}</p>
            </div>
          )}
        </Section>

        {/* Financial snapshot */}
        <Section title="Financial Snapshot">
          <Row label="Employment status" value={app.employment_status} />
        </Section>

        {/* Application responses */}
        <Section title="Application Responses">
          <div className="space-y-4">
            {[
              ['Why join Week 1?', app.why_join],
              ['Goal for the 12-week programme', app.programme_goal],
              ['Current obstacle', app.current_obstacle],
              ['Commitment level', app.commitment_level],
              ['12-month goal', app.twelve_month_goal],
              ['Additional information', app.additional_information],
            ].map(([label, value]) => value && (
              <div key={label as string}>
                <p className="text-[#5a5a66] text-xs uppercase tracking-wide mb-1.5">{label}</p>
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Notes & activity — reuses the mentor-calls StaffNotes component,
            backed by staff_audit_log via /api/admin/applications/[id]/notes */}
        <Section title="Notes & Activity">
          <StaffNotes apiBase={`/api/admin/applications/${id}/notes`} />
        </Section>

        {/* Danger zone — kept visually separate from the 4 routine decision
            buttons above so a stray click can't reach it. Permanent delete,
            not a status change: frees the applicant to submit a fresh
            application immediately (archive does not, since it's a status
            demotion, not a row removal). */}
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(239,68,68,0.03)', border: '1px dashed rgba(239,68,68,0.2)' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-red-400 text-xs font-semibold uppercase tracking-wide mb-1">Danger Zone</p>
              <p className="text-[#5a5a66] text-xs leading-relaxed max-w-md">
                Permanently deletes this application. The applicant will immediately be able to submit a new one. No email is sent. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => requestAction(deleteApplication, `Permanently delete ${app.full_name}'s application? This cannot be undone — they'll be able to submit a new application right away.`)}
              disabled={actionBusy === 'delete'}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2.5 rounded-xl transition-all disabled:opacity-50"
              style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)' }}>
              {actionBusy === 'delete' ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Delete Application
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium z-50"
          style={{ background: 'rgba(17,17,19,0.98)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}

      {confirming && (
        <ConfirmDialog message={confirming.message} busy={confirmBusy}
          onConfirm={confirmAndRun} onCancel={() => setConfirming(null)} />
      )}
    </div>
  )
}

function ConfirmDialog({ message, busy, onConfirm, onCancel }: { message: string; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: 'rgba(17,17,19,0.98)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <p className="text-sm text-white leading-relaxed mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#8e8e9a] transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium disabled:opacity-50 transition-all"
            style={{ color: '#0a0a0b', background: '#c9a84c' }}>
            {busy && <Loader2 size={11} className="animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
