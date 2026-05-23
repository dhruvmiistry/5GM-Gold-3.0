'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react'

const experienceOptions = [
  { value: 'beginner', label: 'Beginner — Under 1 year' },
  { value: 'developing', label: 'Developing — 1–2 years' },
  { value: 'intermediate', label: 'Intermediate — 2–4 years' },
  { value: 'advanced', label: 'Advanced — 4+ years' },
  { value: 'funded', label: 'Funded Trader' },
]

export default function SignupPage() {
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [experience, setExperience] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !experience) {
      setError('Please complete all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await signup(name, email, password, experience)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-4 py-16 relative">
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[300px] bg-[rgba(201,168,76,0.03)] blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-[rgba(201,168,76,0.12)] border border-[rgba(201,168,76,0.25)] flex items-center justify-center">
              <span className="text-[#c9a84c] font-bold text-base">5G</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-semibold text-base">5GM</span>
              <span className="text-[#c9a84c] text-[10px] tracking-[0.15em] uppercase">Gold</span>
            </div>
          </Link>
          <h1 className="text-white text-2xl font-light mt-6 mb-2">Create free account</h1>
          <p className="text-[#5a5a66] text-sm text-center">Access free weekly briefings from four traders</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#8e8e9a] text-xs font-medium mb-2 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="input-dark"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-[#8e8e9a] text-xs font-medium mb-2 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input-dark"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-[#8e8e9a] text-xs font-medium mb-2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="input-dark pr-12"
                autoComplete="new-password"
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
            <label className="block text-[#8e8e9a] text-xs font-medium mb-2 uppercase tracking-wider">Trading Experience</label>
            <div className="relative">
              <select
                value={experience}
                onChange={e => setExperience(e.target.value)}
                className="input-dark appearance-none pr-10 cursor-pointer"
              >
                <option value="" disabled>Select your experience level</option>
                {experienceOptions.map(o => (
                  <option key={o.value} value={o.value} className="bg-[#18181b]">
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a66] pointer-events-none" />
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#e85757] bg-[rgba(232,87,87,0.08)] border border-[rgba(232,87,87,0.2)] rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating account...
              </>
            ) : 'Create Free Account'}
          </button>
        </form>

        <p className="text-center text-xs text-[#5a5a66] mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-[#c9a84c] hover:text-[#e8c96d] transition-colors font-medium">
            Sign in
          </Link>
        </p>

        <p className="text-center text-[11px] text-[#5a5a66] mt-6 leading-relaxed">
          Free access. No credit card. No pricing.
          <br />
          Gold premium access is coming soon.
        </p>
      </div>
    </div>
  )
}
