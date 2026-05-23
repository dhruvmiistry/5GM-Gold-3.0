'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const navLinks = [
    { label: 'Free Briefings', href: '/free-access' },
    { label: 'About', href: '/#team' },
    { label: 'Platform', href: '/#platform' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-[rgba(255,255,255,0.06)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(201,168,76,0.12)] border border-[rgba(201,168,76,0.25)] flex items-center justify-center">
            <span className="text-[#c9a84c] font-bold text-sm">5G</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-semibold text-sm tracking-wide">5GM</span>
            <span className="text-[#c9a84c] text-[10px] font-medium tracking-[0.15em] uppercase">Gold</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-sm text-[#8e8e9a] hover:text-white transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.04)]"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.25)] text-[#c9a84c] text-sm font-medium hover:bg-[rgba(201,168,76,0.15)] transition-all"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm text-[#8e8e9a] hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg bg-[#c9a84c] text-black text-sm font-semibold hover:bg-[#e8c96d] transition-all"
              >
                Join Free Access
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-[#8e8e9a] hover:text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[rgba(255,255,255,0.06)] bg-[#0a0a0b] px-6 py-4 space-y-1">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-[#8e8e9a] hover:text-white rounded-lg hover:bg-[rgba(255,255,255,0.04)]"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex flex-col gap-2 mt-2">
            {user ? (
              <Link href="/dashboard" onClick={() => setOpen(false)} className="px-4 py-3 text-center rounded-lg bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.25)] text-[#c9a84c] text-sm font-medium">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="px-4 py-3 text-center text-sm text-[#8e8e9a] border border-[rgba(255,255,255,0.08)] rounded-lg">Sign in</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="px-4 py-3 text-center rounded-lg bg-[#c9a84c] text-black text-sm font-semibold">Join Free Access</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
