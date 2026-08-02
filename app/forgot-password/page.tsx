'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Enter your email address.'); return }
    setError('')
    setLoading(true)
    try {
      await sendPasswordReset(email)
      setSent(true)
      setCooldown(60)
      const t = setInterval(() => setCooldown(s => (s <= 1 ? (clearInterval(t), 0) : s - 1)), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
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
          <h1 className="text-white text-2xl font-light mt-6 mb-2">Reset your password</h1>
          <p className="text-[#5a5a66] text-sm text-center">
            {sent
              ? 'Check your inbox for a link to reset your password.'
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {sent ? (
          <div className="text-sm text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.2)] rounded-lg px-4 py-3.5 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <div>
              <p>If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way.</p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={cooldown > 0 || loading}
                className="mt-2 text-xs text-[#c9a84c] hover:text-[#e8c96d] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#8e8e9a] text-xs font-medium mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-dark"
                autoComplete="email"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-[#e85757] bg-[rgba(232,87,87,0.08)] border border-[rgba(232,87,87,0.2)] rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[#5a5a66] mt-6">
          <Link href="/login" className="text-[#c9a84c] hover:text-[#e8c96d] transition-colors font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
