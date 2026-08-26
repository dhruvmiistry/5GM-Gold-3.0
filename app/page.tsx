'use client'

import { Zap } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HeroSection from '@/components/HeroSection'
import ResetRoadmap from '@/components/ResetRoadmap'
import TeamCard from '@/components/TeamCard'
import CTASection from '@/components/CTASection'
import { mockTeam, resetLessons } from '@/lib/mockData'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <Navbar />

      {/* Hero */}
      <HeroSection />

      {/* The Reset curriculum */}
      <section className="min-h-screen flex flex-col justify-center py-16 px-6 scroll-mt-16" id="platform">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-10">
            <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest mb-3">The Reset</p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight mb-4">
              <span className="text-white" style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontStyle: 'normal' }}>Twenty lessons. Zero cost.</span>
              <br />
              <span className="font-display italic text-gold-gradient">Built to rebuild your foundations.</span>
            </h2>
            <p className="text-[#8e8e9a] text-base font-light max-w-xl mx-auto">
              A free, structured beginner course from the 5GM mentors — start from the ground up, at your own pace.
            </p>
          </div>

          <ResetRoadmap />
        </div>
      </section>

      {/* Free Funnel Section */}
      <section className="min-h-screen flex flex-col justify-center py-16 scroll-mt-16" id="about">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center rounded-full overflow-hidden mb-6" style={{ border: '1px solid rgba(201,168,76,0.25)' }}>
                <span
                  className="flex items-center justify-center w-8 h-8 shrink-0"
                  style={{ background: 'linear-gradient(135deg, #b8932e 0%, #e8c96d 50%, #c9a84c 100%)' }}
                >
                  <Zap size={13} className="text-black" strokeWidth={2.25} />
                </span>
                <span className="pl-3 pr-4 py-1.5 text-white text-sm font-medium glass">Built For Beginners</span>
              </div>
              <h2 className="text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight mb-6">
                <span className="text-white" style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontStyle: 'normal' }}>For traders stuck</span>
                <br />
                <span className="font-display italic text-gold-gradient">in the cycle.</span>
              </h2>
              <p className="text-[#8e8e9a] text-base leading-relaxed mb-8">
                Information overload. Strategy hopping. No risk management. No real structure. The Reset exists to break that cycle — a free, structured path built from the ground up by the 5GM mentors.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Stop jumping between strategies with no foundation',
                  'Learn market structure before risking real money',
                  'Build risk management habits from lesson one',
                  '20 lessons, structured start to finish — not random videos',
                  'Completely free. No card, no catch.',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#8e8e9a]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-4">
                <a href="/signup" className="px-6 py-3 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all">
                  Start The Reset
                </a>
                <a href="/dashboard/free-videos" className="text-sm text-[#8e8e9a] hover:text-white transition-colors">
                  Explore free mentor videos →
                </a>
              </div>
            </div>

            <div className="relative">
              {/* ambient glow behind cards */}
              <div className="absolute -inset-4 rounded-3xl" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%)' }} />

              <div className="relative space-y-3">
                {resetLessons.slice(0, 3).map((lesson, i) => (
                  <Link
                    href="/signup"
                    key={lesson.number}
                    className="group flex items-center gap-4 p-4 rounded-2xl card card-gold card-lift cursor-pointer"
                    style={{ opacity: 1 - i * 0.12, transform: `translateX(${i * 6}px)` }}
                  >
                    {/* lesson number */}
                    <div className="relative w-12 h-12 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)', border: '1px solid rgba(201,168,76,0.15)' }}>
                      <span className="text-[#c9a84c] text-sm font-semibold">{String(lesson.number).padStart(2, '0')}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#c9a84c] text-[9px] font-semibold uppercase tracking-widest">Lesson {lesson.number}</span>
                        {lesson.number === 1 && (
                          <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>Start Here</span>
                        )}
                      </div>
                      <p className="text-white text-sm font-medium leading-snug truncate">{lesson.title}</p>
                      <p className="text-[#5a5a66] text-[11px] mt-0.5 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#c9a84c] opacity-40 shrink-0" />
                        {lesson.presenter}
                      </p>
                    </div>

                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full text-[#c9a84c]" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)' }}>
                      Free
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="min-h-screen flex flex-col justify-center py-16 px-6 scroll-mt-16" id="team">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-10">
            <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest mb-3">The Analysts</p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight mb-4">
              <span className="text-white" style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontStyle: 'normal' }}>Five mentors.</span>
              <br />
              <span className="font-display italic text-gold-gradient">One platform.</span>
            </h2>
            <p className="text-[#8e8e9a] text-base font-light max-w-xl mx-auto">
              The same five mentors behind 5GM Gold, teaching The Reset from lesson one.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {mockTeam.map((member, i) => (
              <TeamCard key={member.id} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>


      <CTASection
        badge="Free Access"
        title="Start The Reset."
        titleAccent="Completely Free."
        subtitle="20 lessons. 5 mentors. No pricing, no obligation — build your trading foundations from the ground up."
        primaryLabel="Start The Reset — Free"
        primaryHref="/signup"
        secondaryLabel="Sign In"
        secondaryHref="/login"
      />

      <Footer />
    </div>
  )
}
