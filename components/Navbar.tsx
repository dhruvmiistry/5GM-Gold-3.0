'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'The Reset', href: '/#platform' },
  { label: 'About', href: '/#about' },
  { label: 'Mentors', href: '/#team' },
]

export default function Navbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-5 px-4 pointer-events-none">

      {/* Logo floating above the pill */}
      <Link href="/" className="mb-3 pointer-events-auto group">
        <Image
          src="/logo.png"
          alt="5GM Gold"
          width={96}
          height={30}
          className="h-10 w-auto object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_16px_rgba(201,168,76,0.55)]"
          priority
        />
      </Link>

      {/* Floating pill */}
      <div
        className="pointer-events-auto w-full md:w-auto max-w-3xl rounded-full flex items-center px-2 py-1.5"
        style={{
          background: scrolled ? 'rgba(8,8,9,0.90)' : 'rgba(12,12,14,0.78)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: scrolled
            ? '1px solid rgba(201,168,76,0.16)'
            : '1px solid rgba(255,255,255,0.09)',
          boxShadow: scrolled
            ? '0 4px 40px rgba(0,0,0,0.55), 0 0 80px rgba(201,168,76,0.05), inset 0 1px 0 rgba(255,255,255,0.04)'
            : '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
          transition: 'background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        {/* Desktop — nav links */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-1.5 text-[13px] font-medium rounded-full whitespace-nowrap transition-all duration-200 hover:text-white hover:bg-[rgba(255,255,255,0.07)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-4 mx-2" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Desktop — CTAs */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                background: 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.22)',
                color: 'var(--gold)',
              }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-200 hover:text-white hover:bg-[rgba(255,255,255,0.06)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)',
                  color: '#0a0a0b',
                  boxShadow: '0 0 18px rgba(201,168,76,0.22)',
                }}
              >
                Start The Reset
              </Link>
            </>
          )}
        </div>

        {/* Mobile — hamburger */}
        <div className="md:hidden flex items-center justify-between w-full px-2">
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>Menu</span>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="p-1.5 rounded-full transition-all duration-200 hover:bg-[rgba(255,255,255,0.07)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className="pointer-events-auto w-full max-w-3xl mt-2 rounded-2xl overflow-hidden"
        style={{
          maxHeight: open ? '420px' : '0px',
          opacity: open ? 1 : 0,
          transition: 'max-height 0.35s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.25s ease',
        }}
      >
        <div
          className="p-3 flex flex-col gap-1"
          style={{
            background: 'rgba(8,8,9,0.97)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
          }}
        >
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 text-[13px] font-medium rounded-xl transition-all duration-200 hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {l.label}
            </Link>
          ))}
          <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          {user ? (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="px-4 py-3 text-center rounded-xl text-[13px] font-semibold"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.2)',
                color: 'var(--gold)',
              }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-center rounded-xl text-[13px] font-medium"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-center rounded-xl text-[13px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)',
                  color: '#0a0a0b',
                  boxShadow: '0 0 16px rgba(201,168,76,0.2)',
                }}
              >
                Start The Reset
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
