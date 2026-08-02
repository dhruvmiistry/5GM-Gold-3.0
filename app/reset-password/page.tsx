'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

// Checks for an active session directly rather than waiting on auth-context's
// `user` (which additionally fetches/creates a profile row — unnecessary here
// and slower). By the time this page loads, /auth/callback has already
// exchanged the recovery code for a session, so getSession() resolves
// immediately from the same singleton client with no network round-trip.
function useHasSession() {
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')
  useEffect(() => {
    let mounted = true
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (mounted) setStatus(session ? 'valid' : 'invalid')
    })
    return () => { mounted = false }
  }, [])
  return status
}

export default function ResetPasswordPage() {
  const { confirmPasswordReset } = useAuth()
  const router = useRouter()
  const sessionStatus = useHasSession()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => router.replace('/dashboard'), 1800)
    return () => clearTimeout(t)
  }, [saved, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    setSaving(true)
    try {
      await confirmPasswordReset(newPassword)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-4 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[rgba(201,168,76,0.04)] blur-[100px] rounded-full pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="mb-2">
            <Image src="/logo.png" alt="5GM Gold" width={140} height={44} className="h-10 w-auto object-contain" />
          </Link>
          <h1 className="text-white text-2xl font-light mt-6 mb-2">Set a new password</h1>
        </div>

        {sessionStatus === 'checking' && (
          <div className="flex justify-center py-8">
            <Loader2 size={22} className="text-[#c9a84c] animate-spin" />
          </div>
        )}

        {sessionStatus === 'invalid' && (
          <div className="text-sm text-[#e85757] bg-[rgba(232,87,87,0.08)] border border-[rgba(232,87,87,0.2)] rounded-lg px-4 py-3.5">
            <p>This reset link has expired or already been used.</p>
            <Link href="/forgot-password" className="mt-1.5 inline-block text-xs text-[#c9a84c] hover:text-[#e8c96d] font-medium">
              Request a new one
            </Link>
          </div>
        )}

        {sessionStatus === 'valid' && (
          saved ? (
            <div className="text-sm text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.2)] rounded-lg px-4 py-3.5 flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0" />
              Password updated. Taking you to your dashboard...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#8e8e9a] text-xs font-medium mb-2 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="input-dark pr-12"
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a66] hover:text-[#8e8e9a] transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#8e8e9a] text-xs font-medium mb-2 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-dark"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="text-sm text-[#e85757] bg-[rgba(232,87,87,0.08)] border border-[rgba(232,87,87,0.2)] rounded-lg px-3 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Updating...
                  </>
                ) : 'Update password'}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  )
}
