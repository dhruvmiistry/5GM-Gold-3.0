'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, TrendingUp, UserMinus, Loader2, ChevronLeft, Ban, RotateCcw } from 'lucide-react'

type Profile = {
  id: string; full_name: string | null; email: string | null
  plan: string; role: string; access_level: string
  trading_experience: string | null; created_at: string; banned: boolean
}

function PlanBadge({ plan, role }: { plan: string; role: string }) {
  if (role === 'admin') return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#c9a84c] bg-[rgba(201,168,76,0.12)] border border-[rgba(201,168,76,0.2)]">Admin</span>
  if (plan === 'gold') return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)]">Gold</span>
  return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">Free</span>
}

const PAGE_SIZE = 50

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input — 300ms
  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 300)
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (planFilter !== 'all') params.set('plan', planFilter)
    const res = await fetch(`/api/admin/users?${params}`)
    const json = await res.json()
    setUsers(Array.isArray(json.data) ? json.data : [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [debouncedSearch, planFilter, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const updateUser = async (userId: string, updates: Partial<Profile>) => {
    setUpdatingId(userId)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates }),
    })
    if (res.ok) {
      await fetchUsers()
      showToast('User updated successfully')
    } else {
      const json = await res.json().catch(() => ({}))
      showToast(json.error ?? 'Failed to update user')
    }
    setUpdatingId(null)
  }

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1.5">Admin</p>
            <h1 className="text-2xl font-light text-white tracking-tight">Users</h1>
            <p className="text-[#5a5a66] text-sm mt-1">{total} members total</p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a5a66]" />
            <input
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by name or email…"
              className="input-dark pl-9 w-full text-sm"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'free', 'gold'].map(f => (
              <button key={f} onClick={() => setPlanFilter(f)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all capitalize"
                style={planFilter === f
                  ? { background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }
                  : { background: 'rgba(255,255,255,0.04)', color: '#5a5a66', border: '1px solid rgba(255,255,255,0.07)' }
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Header row */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.05)]"
            style={{ background: 'rgba(17,17,19,0.95)' }}>
            {['Name / Email', 'Plan', 'Experience', 'Joined', 'Actions'].map((h, i) => (
              <div key={h} className={`text-[10px] font-semibold uppercase tracking-widest text-[#3a3a46] ${i === 0 ? 'col-span-4' : i === 4 ? 'col-span-2 text-right' : 'col-span-2'}`}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ background: 'rgba(17,17,19,0.7)' }}>
              <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center" style={{ background: 'rgba(17,17,19,0.7)' }}>
              <p className="text-[#5a5a66] text-sm">No users found</p>
            </div>
          ) : users.map((user, idx) => (
            <div key={user.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 items-center transition-colors"
              style={{
                background: idx % 2 === 0 ? 'rgba(17,17,19,0.7)' : 'rgba(12,12,14,0.7)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {/* Name / Email */}
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                  <span className="text-[#c9a84c] text-[11px] font-bold">
                    {(user.full_name || user.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">{user.full_name || '—'}</p>
                  <p className="text-[#5a5a66] text-[10px] truncate">{user.email}</p>
                </div>
              </div>

              {/* Plan */}
              <div className="col-span-2 flex items-center gap-1.5">
                <PlanBadge plan={user.plan} role={user.role} />
                {user.banned && (
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-red-400 bg-red-500/10 border border-red-500/25">Banned</span>
                )}
              </div>

              {/* Experience */}
              <div className="col-span-2">
                <span className="text-[#8e8e9a] text-xs capitalize">{user.trading_experience || '—'}</span>
              </div>

              {/* Joined */}
              <div className="col-span-2">
                <span className="text-[#5a5a66] text-[11px]">
                  {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-2">
                {updatingId === user.id ? (
                  <Loader2 size={14} className="animate-spin text-[#c9a84c]" />
                ) : user.role !== 'admin' && (
                  <>
                    {user.plan === 'free' ? (
                      <button onClick={() => updateUser(user.id, { plan: 'gold', access_level: 'gold' })}
                        className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-all text-[#c9a84c] hover:bg-[rgba(201,168,76,0.1)]"
                        style={{ border: '1px solid rgba(201,168,76,0.2)' }}
                        title="Upgrade to Gold"
                      >
                        <TrendingUp size={10} /> Upgrade
                      </button>
                    ) : (
                      <button onClick={() => updateUser(user.id, { plan: 'free', access_level: 'free' })}
                        className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-all text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        title="Downgrade to Free"
                      >
                        <UserMinus size={10} /> Downgrade
                      </button>
                    )}
                    {user.banned ? (
                      <button onClick={() => updateUser(user.id, { banned: false })}
                        className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-all text-[#c9a84c] hover:bg-[rgba(201,168,76,0.1)]"
                        style={{ border: '1px solid rgba(201,168,76,0.2)' }}
                        title="Unban user"
                      >
                        <RotateCcw size={10} /> Unban
                      </button>
                    ) : (
                      <button onClick={() => updateUser(user.id, { banned: true })}
                        className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-all text-red-400 hover:bg-red-500/10"
                        style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                        title="Ban user"
                      >
                        <Ban size={10} /> Ban
                      </button>
                    )}
                  </>
                )}
                <Link href={`/admin/users/${user.id}`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a66] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-[#5a5a66] text-xs">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] disabled:opacity-30 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[#5a5a66] text-xs px-2">Page {page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a5a66] disabled:opacity-30 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium z-50"
          style={{ background: 'rgba(17,17,19,0.98)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
