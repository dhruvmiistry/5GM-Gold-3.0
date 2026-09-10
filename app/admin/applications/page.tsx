'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Search, ChevronRight, ChevronLeft, Loader2, X, Inbox,
  Users, Sparkles, Eye, PhoneCall, Trophy, XCircle, Archive,
  LayoutGrid, Phone, CalendarDays, type LucideIcon,
} from 'lucide-react'

type Application = {
  id: string; full_name: string; email: string; phone_number: string
  country: string | null; trading_level: string | null; commitment_level: string | null
  status: string; submitted_at: string
}

// Shared tone language — same fg/bg/border shape used on the application
// detail page's EmailStatusBadge/EMAIL_TONE, so status color means the
// same thing everywhere in this admin surface.
const TONE: Record<string, { fg: string; bg: string; border: string }> = {
  neutral: { fg: '#8e8e9a', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' },
  gold: { fg: '#e0c26e', bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.28)' },
  blue: { fg: '#7cb4fb', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.28)' },
  positive: { fg: '#5fc797', bg: 'rgba(76,175,125,0.12)', border: 'rgba(76,175,125,0.28)' },
  danger: { fg: '#fb8484', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.28)' },
}

// Single source of truth: the statuses this admin surface actually drives
// (new → reviewing → invited_to_call/accepted_week_one/rejected → archived,
// see the 4 DECISIONS buttons on the detail page). 'qualified'/'enrolled'
// exist in the DB check constraint but nothing in this app sets them
// anymore, so they're deliberately left out — every box on this dashboard
// should correspond to a status an admin can actually land an application
// in. Stat tiles and filter pills both render off this one list so they
// can never drift out of sync with each other again.
const STATUSES: { key: string; label: string; icon: LucideIcon; tone: keyof typeof TONE }[] = [
  { key: 'new', label: 'New', icon: Sparkles, tone: 'gold' },
  { key: 'reviewing', label: 'Reviewing', icon: Eye, tone: 'blue' },
  { key: 'invited_to_call', label: 'Invited To Call', icon: PhoneCall, tone: 'gold' },
  { key: 'accepted_week_one', label: 'Accepted Week 1', icon: Trophy, tone: 'positive' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, tone: 'danger' },
  { key: 'archived', label: 'Archived', icon: Archive, tone: 'neutral' },
]

const STATUS_META = Object.fromEntries(STATUSES.map(s => [s.key, s])) as Record<string, typeof STATUSES[number]>

function toneOf(status: string) { return TONE[STATUS_META[status]?.tone ?? 'neutral'] }

function StatusBadge({ status }: { status: string }) {
  const t = toneOf(status)
  return (
    <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border backdrop-blur-sm"
      style={{ color: t.fg, background: t.bg, borderColor: t.border }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.fg }} />
      {(STATUS_META[status]?.label ?? status.replace(/_/g, ' '))}
    </span>
  )
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

function Avatar({ name, status }: { name: string; status: string }) {
  const t = toneOf(status)
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10.5px] font-bold shrink-0 transition-transform duration-200 group-hover:scale-105"
      style={{ background: t.bg, color: t.fg, border: `1.5px solid ${t.border}`, boxShadow: `0 0 0 3px rgba(0,0,0,0.15), 0 2px 10px ${t.bg}` }}>
      {initials(name)}
    </div>
  )
}

function Pill({ active, tone, onClick, children }: { active: boolean; tone: keyof typeof TONE; onClick: () => void; children: React.ReactNode }) {
  const t = TONE[tone]
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-all duration-200 active:scale-95 backdrop-blur-sm"
      style={active
        ? { background: `linear-gradient(135deg, ${t.bg}, transparent)`, color: t.fg, border: `1px solid ${t.border}`, boxShadow: `0 2px 14px ${t.bg}, inset 0 1px 0 rgba(255,255,255,0.05)` }
        : { background: 'rgba(255,255,255,0.03)', color: '#6a6a76', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; if (!active) e.currentTarget.style.color = '#c8c8d0' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; if (!active) e.currentTarget.style.color = '#6a6a76' }}>
      {children}
    </button>
  )
}

const PAGE_SIZE = 50

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setDebouncedSearch(value); setPage(0) }, 300)
  }

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    const res = await fetch(`/api/admin/applications?${params}`)
    const json = await res.json()
    setApplications(Array.isArray(json.data) ? json.data : [])
    setTotal(json.total ?? 0)
    setStats(json.stats ?? {})
    setLoading(false)
  }, [debouncedSearch, statusFilter, page])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const newCount = stats.new ?? 0

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-7 page-enter">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 gold-glow-sm"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.16), rgba(201,168,76,0.04))', border: '1px solid rgba(201,168,76,0.25)' }}>
            <Users size={18} style={{ color: '#e0c26e' }} />
          </div>
          <div>
            <p className="section-label mb-1">Admin</p>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-light text-white tracking-tight">Applications</h1>
              {newCount > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full"
                  style={{ color: '#e0c26e', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.28)' }}>
                  <span className="live-dot" /> {newCount} new
                </span>
              )}
            </div>
            <p className="text-[#5a5a66] text-sm mt-0.5">{total} applications total</p>
          </div>
        </div>

        {/* Stats — one tile per real status, plus Total. Click to filter. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
          {[{ key: 'total', label: 'Total', icon: LayoutGrid, tone: 'neutral' as const }, ...STATUSES].map(({ key, label, icon: Icon, tone }) => {
            const t = TONE[tone]
            const active = statusFilter === (key === 'total' ? 'all' : key)
            return (
              <button key={key} onClick={() => { setStatusFilter(key === 'total' ? 'all' : key); setPage(0) }}
                className="group relative text-left p-3.5 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-sm"
                style={{
                  background: active ? `linear-gradient(160deg, ${t.bg}, rgba(17,17,19,0.75))` : 'rgba(17,17,19,0.65)',
                  border: active ? `1px solid ${t.border}` : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: active ? `0 4px 20px ${t.bg}, inset 0 1px 0 rgba(255,255,255,0.04)` : undefined,
                }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle at 30% 0%, ${t.bg}, transparent 70%)` }} />
                <div className="relative w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${t.bg}, transparent)`, border: `1px solid ${t.border}` }}>
                  <Icon size={13} style={{ color: t.fg }} />
                </div>
                <p className="relative text-white text-lg font-semibold tabular-nums tracking-tight">{key === 'total' ? total : stats[key] ?? 0}</p>
                <p className="relative text-[#5a5a66] text-[10px] uppercase tracking-wide mt-0.5">{label}</p>
              </button>
            )
          })}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-3 p-3.5 rounded-2xl backdrop-blur-sm" style={{ background: 'rgba(14,14,16,0.55)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a5a66]" />
            <input value={search} onChange={e => handleSearchChange(e.target.value)} placeholder="Search by name, email, or phone…"
              className="w-full text-sm rounded-full pl-10 pr-9 py-2.5 outline-none transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.08)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }} />
            {search && (
              <button onClick={() => handleSearchChange('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a5a66] hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Pill active={statusFilter === 'all'} tone="neutral" onClick={() => { setStatusFilter('all'); setPage(0) }}>
              <LayoutGrid size={11} /> All <span className="tabular-nums opacity-60">{stats.total ?? 0}</span>
            </Pill>
            {STATUSES.map(({ key, label, icon: Icon, tone }) => (
              <Pill key={key} active={statusFilter === key} tone={tone} onClick={() => { setStatusFilter(key); setPage(0) }}>
                <Icon size={11} /> {label} <span className="tabular-nums opacity-60">{stats[key] ?? 0}</span>
              </Pill>
            ))}
          </div>
        </div>

        {/* Table — desktop / tablet */}
        <div className="hidden md:block rounded-2xl overflow-hidden backdrop-blur-sm" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.05)]" style={{ background: 'rgba(17,17,19,0.95)' }}>
            {['Name / Email', 'Phone', 'Level', 'Commitment', 'Status', 'Submitted', ''].map((h, i) => (
              <div key={h} className={`text-[10px] font-semibold uppercase tracking-widest text-[#3a3a46] ${i === 0 ? 'col-span-3' : i === 6 ? 'col-span-1' : 'col-span-2'}`}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ background: 'rgba(17,17,19,0.7)' }}>
              <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
            </div>
          ) : applications.length === 0 ? (
            <EmptyState />
          ) : applications.map((app, idx) => {
            const t = toneOf(app.status)
            return (
              <Link key={app.id} href={`/admin/applications/${app.id}`}
                className={`group relative grid grid-cols-12 gap-4 px-5 py-4 items-center transition-all duration-200 hover:bg-[rgba(255,255,255,0.025)] hover:z-10 ${idx % 2 === 0 ? 'bg-[rgba(17,17,19,0.7)]' : 'bg-[rgba(12,12,14,0.7)]'}`}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 group-hover:w-1"
                  style={{ background: t.fg, opacity: app.status === 'new' ? 0.65 : 0.3 }} />

                <div className="col-span-3 min-w-0 flex items-center gap-2.5">
                  <Avatar name={app.full_name} status={app.status} />
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium truncate flex items-center gap-1.5">
                      {app.full_name}
                      {app.status === 'new' && <span className="live-dot shrink-0" title="Not yet reviewed" />}
                    </p>
                    <p className="text-[#5a5a66] text-[10px] truncate">{app.email}</p>
                  </div>
                </div>

                <div className="col-span-2 min-w-0">
                  <span className="text-[#8e8e9a] text-xs truncate">{app.phone_number}</span>
                </div>

                <div className="col-span-2"><Tag text={app.trading_level} /></div>
                <div className="col-span-2"><Tag text={app.commitment_level} /></div>
                <div className="col-span-2"><StatusBadge status={app.status} /></div>

                <div className="col-span-1 flex items-center justify-end gap-2">
                  <span className="text-[#5a5a66] text-[10px] hidden lg:inline">
                    {new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <ChevronRight size={14} className="text-[#5a5a66] shrink-0 transition-all duration-200 group-hover:translate-x-0.5" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden space-y-2.5">
          {loading ? (
            <div className="flex items-center justify-center py-16 rounded-2xl" style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}><EmptyState /></div>
          ) : applications.map(app => {
            const t = toneOf(app.status)
            return (
              <Link key={app.id} href={`/admin/applications/${app.id}`}
                className="relative flex flex-col gap-3 p-4 rounded-2xl overflow-hidden transition-transform active:scale-[0.99]"
                style={{ background: 'rgba(17,17,19,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: t.fg, opacity: app.status === 'new' ? 0.65 : 0.3 }} />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={app.full_name} status={app.status} />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate flex items-center gap-1.5">
                        {app.full_name}
                        {app.status === 'new' && <span className="live-dot shrink-0" />}
                      </p>
                      <p className="text-[#5a5a66] text-[11px] truncate">{app.email}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#5a5a66] shrink-0" />
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag text={app.trading_level} />
                    <Tag text={app.commitment_level} />
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                <div className="flex items-center gap-3 text-[10.5px] text-[#5a5a66] pt-1 border-t border-[rgba(255,255,255,0.05)]">
                  <span className="flex items-center gap-1"><Phone size={10} /> {app.phone_number}</span>
                  <span className="flex items-center gap-1"><CalendarDays size={10} /> {new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
              </Link>
            )
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-[#5a5a66] text-xs">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</p>
            <div className="flex items-center gap-2 p-1 rounded-full" style={{ background: 'rgba(17,17,19,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5a5a66] disabled:opacity-30 disabled:hover:bg-transparent hover:text-[#e0c26e] hover:bg-[rgba(201,168,76,0.1)] transition-all duration-200 active:scale-90">
                <ChevronLeft size={14} />
              </button>
              <span className="text-[#8e8e9a] text-xs px-2 tabular-nums font-medium">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5a5a66] disabled:opacity-30 disabled:hover:bg-transparent hover:text-[#e0c26e] hover:bg-[rgba(201,168,76,0.1)] transition-all duration-200 active:scale-90">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Tag({ text }: { text: string | null }) {
  if (!text) return <span className="text-[#3a3a46] text-xs">—</span>
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] text-[#8e8e9a] truncate max-w-full"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {text}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 gap-3" style={{ background: 'rgba(17,17,19,0.7)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <Inbox size={16} className="text-[#5a5a66]" />
      </div>
      <p className="text-[#5a5a66] text-sm">No applications found</p>
    </div>
  )
}
