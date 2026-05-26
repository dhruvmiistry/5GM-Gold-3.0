'use client'

import { BarChart2, BookOpen, Eye, Radio, Shield, TrendingUp, Zap } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HeroSection from '@/components/HeroSection'
import FeatureCard from '@/components/FeatureCard'
import TeamCard from '@/components/TeamCard'
import CTASection from '@/components/CTASection'
import { mockTeam } from '@/lib/mockData'

const features = [
  { icon: TrendingUp, title: 'Weekly Outlooks', description: 'Full analyst coverage of key markets every Monday. Know the narrative before the move.', locked: true },
  { icon: Radio, title: 'Private Coaching', description: 'One-to-one sessions with 5GM analysts. Private advisory tailored to your trading.', locked: true },
  { icon: Eye, title: 'Live Sessions', description: 'Access the live trading room. Watch 5GM analysts work through market structure in real time.', locked: true },
  { icon: Shield, title: 'Strategy Vault', description: 'Complete playbooks, execution models, and trade frameworks from the full analyst team.', locked: true },
  { icon: BarChart2, title: 'Market Breakdowns', description: 'Detailed analysis of individual instruments. Free content available weekly.', locked: false },
  { icon: BookOpen, title: 'Development Modules', description: 'Eight structured modules from market foundations to professional execution standards.', locked: true },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <Navbar />

      {/* Hero */}
      <HeroSection />

      {/* Features */}
      <section className="py-24 px-6 max-w-7xl mx-auto" id="platform">
        <div className="text-center mb-16">
          <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest mb-3">The Platform</p>
          <h2 className="text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight mb-6">
            <span className="text-white" style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontStyle: 'normal' }}>One private ecosystem.</span>
            <br />
            <span className="font-display italic text-gold-gradient">Built for serious traders.</span>
          </h2>
          <p className="text-[#8e8e9a] text-lg font-light max-w-xl mx-auto">
            Free weekly analyst videos — with a full private trading platform behind Gold access.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </section>

      {/* Free Funnel Section */}
      <section className="py-24 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.2)] mb-6">
                <Zap size={12} className="text-[#c9a84c]" />
                <span className="text-[#c9a84c] text-xs font-medium tracking-wide">Weekly Intelligence</span>
              </div>
              <h2 className="text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight mb-6">
                <span className="text-white" style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontStyle: 'normal' }}>Three free videos.</span>
                <br />
                <span className="font-display italic text-gold-gradient">Every week.</span>
              </h2>
              <p className="text-[#8e8e9a] text-base leading-relaxed mb-8">
                Access three new analyst videos every week from the 5GM team. Weekly outlooks, market breakdowns, and trader psychology — inside the platform, free.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Fresh videos released each week',
                  'Four analysts covering different instruments',
                  'Outlooks, breakdowns, and psychology',
                  'No pricing. Platform access is free.',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#8e8e9a]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-4">
                <a href="/signup" className="px-6 py-3 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all">
                  Enter Platform
                </a>
                <a href="/dashboard/free-videos" className="text-sm text-[#8e8e9a] hover:text-white transition-colors">
                  View videos →
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="space-y-3">
                {[
                  { category: 'Weekly Outlook', title: 'DXY & Gold Setup — This Week', trader: 'Trader One', time: '30:47' },
                  { category: 'Market Breakdown', title: 'NASDAQ Structure Shift Confirmed', trader: 'Trader Two', time: '20:34' },
                  { category: 'Psychology', title: 'Managing Drawdown Like a Professional', trader: 'Trader Three', time: '15:56' },
                ].map((v, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl card transition-all" style={{ opacity: 1 - i * 0.08 }}>
                    <div className="w-14 h-10 rounded-lg bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.1)] flex items-center justify-center shrink-0">
                      <Eye size={14} className="text-[#c9a84c] opacity-60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[#c9a84c] text-[10px] font-medium tracking-wide block mb-0.5">{v.category}</span>
                      <p className="text-white text-xs font-medium truncate">{v.title}</p>
                      <p className="text-[#5a5a66] text-[11px] mt-0.5">{v.trader}</p>
                    </div>
                    <span className="text-[#5a5a66] text-xs font-mono shrink-0">{v.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 px-6 border-t border-[rgba(255,255,255,0.06)]" id="team">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest mb-3">The Analysts</p>
            <h2 className="text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight mb-6">
              <span className="text-white" style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontStyle: 'normal' }}>Four analysts.</span>
              <br />
              <span className="font-display italic text-gold-gradient">One private platform.</span>
            </h2>
            <p className="text-[#8e8e9a] text-lg font-light max-w-xl mx-auto">
              Each analyst covers distinct instruments and market structures. Collectively — one ecosystem.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {mockTeam.map((member, i) => (
              <TeamCard key={member.id} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>


      <CTASection
        badge="Free Access"
        title="Enter the platform. Free."
        subtitle="No pricing. No obligation. Access weekly analyst videos from inside the 5GM private platform."
        primaryLabel="Create Free Account"
        primaryHref="/signup"
        secondaryLabel="Sign In"
        secondaryHref="/login"
      />

      <Footer />
    </div>
  )
}
