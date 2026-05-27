'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, UserMinus, ShieldCheck, Shield, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string; full_name: string | null; email: string | null
  plan: string; role: string; access_level: string
  trading_experience: string | null; admin_notes: string | null
  created_at: string; updated_at: string
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchProfile = async () => {
    const res = await fetch(`/api/admin/users?id=${id}`)
    const data = await res.json()
    const user = Array.isArray(data) ? data.find((u: Profile) => u.id === id) : null
    if (user) { setProfile(user); setNotes(user.admin_notes ?? '') }
    setLoading(false)
  }

  useEffect(() => { fetchProfile() }, [id])

  const updatePlan = async (plan: string) => {
    setSaving(true)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, updates: { plan, access_level: plan } }),
    })
    await fetchProfile()
    setSaving(false)
    showToast(`Plan updated to ${plan}`)
  }

  const updateRole = async (role: string) => {
    setSaving(true)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, updates: { role } }),
    })
    await fetchProfile()
    setSaving(false)
    showToast(`Role updated to ${role}`)
  }

  const saveNotes = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ admin_notes: notes }).eq('id', id)
    setSaving(false)
    showToast('Notes saved')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-full py-32">
      <Loader2 size={24} className="animate-spin text-[#c9a84c]" />
    </div>
  )

  if (!profile) return (
    <div className="p-8 text-center">
      <p className="text-[#5a5a66]">User not found.</p>
      <Link href="/admin/users" className="text-[#c9a84c] text-sm mt-2 block hover:underline">← Back to users</Link>
    </div>
  )

  const isGold = profile.plan === 'gold'
  const isAdmin = profile.role === 'admin'

  return (
    <div className="dashboard-bg min-h-full">
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-8 space-y-6">

        {/* Back */}
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-[#5a5a66] text-sm hover:text-white transition-colors">
          <ArrowLeft size={14} /> Back to Users
        </Link>

        {/* Profile header */}
        <div className="flex items-center gap-4 p-6 rounded-2xl"
          style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <span className="text-[#c9a84c] text-xl font-bold">{(profile.full_name || profile.email || 'U')[0].toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-white text-xl font-medium">{profile.full_name || '—'}</h1>
            <p className="text-[#5a5a66] text-sm">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {isAdmin && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-[#c9a84c] bg-[rgba(201,168,76,0.12)] border border-[rgba(201,168,76,0.2)]">Admin</span>}
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${isGold ? 'text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)]' : 'text-[#5a5a66] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]'}`}>
                {profile.plan}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile info */}
          <div className="p-6 rounded-2xl space-y-4"
            style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-white font-medium text-sm">Profile Info</h2>
            {[
              { label: 'Email', value: profile.email },
              { label: 'Experience', value: profile.trading_experience, capitalize: true },
              { label: 'Plan', value: profile.plan, capitalize: true },
              { label: 'Role', value: profile.role, capitalize: true },
              { label: 'Access Level', value: profile.access_level, capitalize: true },
              { label: 'Joined', value: new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-[#3a3a42] text-[10px] uppercase tracking-widest mb-1">{f.label}</label>
                <p className={`text-sm px-3 py-2.5 rounded-lg ${f.capitalize ? 'capitalize' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#8e8e9a', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {f.value || '—'}
                </p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {/* Plan management */}
            <div className="p-6 rounded-2xl"
              style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="text-white font-medium text-sm mb-4">Plan Management</h2>
              <div className="space-y-2">
                <button onClick={() => updatePlan('gold')} disabled={isGold || saving}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  <TrendingUp size={14} className="text-[#c9a84c]" />
                  <span className="text-[#c9a84c] text-sm font-medium">Upgrade to Gold</span>
                  {isGold && <span className="ml-auto text-[10px] text-[#c9a84c] opacity-60">Current</span>}
                </button>
                <button onClick={() => updatePlan('free')} disabled={!isGold || isAdmin || saving}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <UserMinus size={14} className="text-[#5a5a66]" />
                  <span className="text-[#8e8e9a] text-sm font-medium">Downgrade to Free</span>
                  {!isGold && <span className="ml-auto text-[10px] text-[#5a5a66] opacity-60">Current</span>}
                </button>
              </div>
            </div>

            {/* Role management */}
            <div className="p-6 rounded-2xl"
              style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="text-white font-medium text-sm mb-4">Role</h2>
              <div className="space-y-2">
                <button onClick={() => updateRole('admin')} disabled={isAdmin || saving}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
                  <ShieldCheck size={14} className="text-[#c9a84c]" />
                  <span className="text-[#c9a84c] text-sm">Make Admin</span>
                </button>
                <button onClick={() => updateRole('member')} disabled={!isAdmin || saving}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Shield size={14} className="text-[#5a5a66]" />
                  <span className="text-[#8e8e9a] text-sm">Remove Admin</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Admin notes */}
        <div className="p-6 rounded-2xl"
          style={{ background: 'rgba(17,17,19,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-white font-medium text-sm mb-4">Admin Notes</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            placeholder="Internal notes about this user…"
            className="input-dark w-full text-sm resize-none"
          />
          <button onClick={saveNotes} disabled={saving}
            className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(201,168,76,0.1)] text-[#c9a84c] text-sm font-medium hover:bg-[rgba(201,168,76,0.16)] transition-all disabled:opacity-60"
            style={{ border: '1px solid rgba(201,168,76,0.2)' }}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save Notes
          </button>
        </div>

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
