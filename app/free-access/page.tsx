'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Check, Play, TrendingUp, BarChart2, BookOpen } from 'lucide-react'

export default function FreeAccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <Navbar />

      <div className="pt-24 pb-0">
        {/* Hero */}
        <section className="py-24 px-6 max-w-4xl mx-auto text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[rgba(201,168,76,0.04)] blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.2)] mb-8">
              <Play size={12} className="text-[#c9a84c]" />
              <span className="text-[#c9a84c] text-xs font-medium tracking-widest uppercase">Weekly Intelligence</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight mb-6">
              <span className="text-white" style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontStyle: 'normal' }}>Analyst briefings.</span>
              <br />
              <span className="font-display italic text-gold-gradient">Every week.</span>
            </h1>

            <p className="text-[#8e8e9a] text-lg font-light leading-relaxed max-w-2xl mx-auto mb-12">
              Three new analyst briefings every week from the 5GM team. Platform access is free.
              No pricing. No obligation. Gold tier launching soon.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all shadow-lg shadow-[rgba(201,168,76,0.15)]"
              >
                Enter Platform
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-xl border border-[rgba(255,255,255,0.1)] text-white text-sm font-medium hover:border-[rgba(255,255,255,0.2)] transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* What you get */}
        <section className="py-16 px-6 border-t border-[rgba(255,255,255,0.06)] max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl leading-[1.05] tracking-tight mb-4 text-white" style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontStyle: 'normal' }}>Inside free platform access</h2>
            <p className="text-[#5a5a66] text-sm">Available immediately. No pricing required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
            {[
              {
                icon: TrendingUp,
                title: 'Weekly Outlooks',
                description: 'One market narrative briefing per week. Understand where the analysts see key structure before the week opens.',
              },
              {
                icon: BarChart2,
                title: 'Market Breakdowns',
                description: 'Instrument-specific analysis from the team. Deep dives into Gold, indices, FX, and more.',
              },
              {
                icon: BookOpen,
                title: 'Psychology & Risk',
                description: 'The mental framework and risk discipline that separates consistent traders from the rest.',
              },
            ].map(item => (
              <div key={item.title} className="p-6 rounded-2xl card">
                <div className="w-10 h-10 rounded-xl bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)] flex items-center justify-center mb-4">
                  <item.icon size={18} className="text-[#c9a84c]" />
                </div>
                <h3 className="text-white font-medium text-base mb-2">{item.title}</h3>
                <p className="text-[#5a5a66] text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Benefits list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
            {[
              '3 new briefings released each week',
              'Four analysts covering different instruments and specialities',
              'Access on any device — desktop, tablet, or mobile',
              'Organised by category — filter by instrument or topic',
              'Platform access is free — no hidden costs',
              'Gold tier launching soon — members notified first',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center shrink-0">
                  <Check size={11} className="text-[#c9a84c]" />
                </div>
                <span className="text-[#8e8e9a] text-sm">{item}</span>
              </div>
            ))}
          </div>

          {/* Email capture form */}
          <div className="p-8 rounded-2xl bg-[#111113] border border-[rgba(201,168,76,0.12)] text-center">
            <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest mb-3">Enter the Platform</p>
            <h3 className="text-white text-2xl font-light mb-3">
              Step inside 5GM Gold.
            </h3>
            <p className="text-[#5a5a66] text-sm mb-8 max-w-sm mx-auto">
              Free analyst briefings every week. Gold tier launching soon. Create your account in under 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="input-dark flex-1"
                readOnly
                onClick={() => window.location.href = '/signup'}
              />
              <Link
                href="/signup"
                className="px-6 py-3 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all whitespace-nowrap"
              >
                Create Account
              </Link>
            </div>
            <p className="text-[#5a5a66] text-xs mt-4">No pricing. Free access to weekly analyst content.</p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
