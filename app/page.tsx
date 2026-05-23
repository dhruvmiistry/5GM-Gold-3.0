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
  { icon: TrendingUp, title: 'Weekly Outlooks', description: 'Full team analysis of key markets every week. Know the narrative before the move.', locked: true },
  { icon: Radio, title: 'Private Mentorship', description: 'One-to-one sessions with experienced traders. Tailored guidance for your development.', locked: true },
  { icon: Eye, title: 'Live Sessions', description: 'Join the live trading room. Watch professional traders work in real time.', locked: true },
  { icon: Shield, title: 'Strategy Vault', description: 'Complete playbooks, execution models, and trade frameworks from the full team.', locked: true },
  { icon: BarChart2, title: 'Market Breakdowns', description: 'Detailed analysis of individual instruments. Free and premium content every week.', locked: false },
  { icon: BookOpen, title: 'Trader Development', description: 'Structured courses from foundations to funded trader execution. Eight complete modules.', locked: true },
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
          <h2 className="text-4xl md:text-5xl font-light text-white mb-5">
            Everything a serious trader needs.
          </h2>
          <p className="text-[#8e8e9a] text-lg font-light max-w-xl mx-auto">
            Five instruments of professional development — from free weekly briefings to a complete private trading platform.
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
                <span className="text-[#c9a84c] text-xs font-medium tracking-wide">Free Weekly Content</span>
              </div>
              <h2 className="text-4xl font-light text-white mb-6 leading-tight">
                3 free briefings
                <br />
                <span className="text-gold-gradient">every single week.</span>
              </h2>
              <p className="text-[#8e8e9a] text-base leading-relaxed mb-8">
                Create a free account and access three new briefings every week from our team of four traders. Weekly outlooks, market breakdowns, and psychology sessions — completely free.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'New content released every week',
                  'Covered by four specialist traders',
                  'Weekly Outlooks, Breakdowns, and Psychology',
                  'No pricing. Free account access only.',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#8e8e9a]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-4">
                <a href="/signup" className="px-6 py-3 rounded-xl bg-[#c9a84c] text-black font-semibold text-sm hover:bg-[#e8c96d] transition-all">
                  Create Free Account
                </a>
                <a href="/dashboard/free-briefings" className="text-sm text-[#8e8e9a] hover:text-white transition-colors">
                  Browse briefings →
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
            <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest mb-3">The Team</p>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-5">
              Watch the market through the lens
              <br />
              <span className="text-gold-gradient">of professional traders.</span>
            </h2>
            <p className="text-[#8e8e9a] text-lg font-light max-w-xl mx-auto">
              Four specialists. Four perspectives. One private platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {mockTeam.map((member, i) => (
              <TeamCard key={member.id} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Platform preview */}
      <section className="py-24 px-6 border-t border-[rgba(255,255,255,0.06)] bg-[#0d0d0f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest mb-3">Dashboard</p>
            <h2 className="text-4xl font-light text-white mb-5">Step inside the 5GM Gold platform.</h2>
            <p className="text-[#8e8e9a] text-base font-light max-w-lg mx-auto">
              A premium trading environment. Not a course site. Not a social feed. A private terminal.
            </p>
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.07)] overflow-hidden bg-[#0a0a0b] shadow-2xl">
            <div className="h-10 bg-[#0d0d0f] border-b border-[rgba(255,255,255,0.06)] flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.08)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.08)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.08)]" />
              </div>
              <div className="flex-1 mx-4 h-5 bg-[rgba(255,255,255,0.04)] rounded-md" />
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {['Free Briefings', 'Gold Modules', 'Live Sessions', 'Breakdowns'].map((label, i) => (
                  <div key={label} className="p-3 rounded-xl bg-[#111113] border border-[rgba(255,255,255,0.06)]">
                    <div className="text-[#5a5a66] text-[10px] mb-1 uppercase tracking-wide">{label}</div>
                    <div className={`text-lg font-semibold ${i === 0 || i === 3 ? 'text-white' : 'text-[#5a5a66]'}`}>
                      {['24', '—', '—', '18'][i]}
                    </div>
                    {i > 0 && i < 3 && <div className="text-[9px] text-[#c9a84c] mt-0.5">Gold required</div>}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
                    <div className="aspect-video rounded-lg mb-3 flex items-center justify-center bg-[rgba(201,168,76,0.03)]">
                      {i === 0 ? <Eye size={18} className="text-[#c9a84c] opacity-30" /> : <Shield size={16} className="text-[#5a5a66] opacity-30" />}
                    </div>
                    <div className="h-2.5 rounded-full bg-[rgba(255,255,255,0.06)] w-3/4 mb-1.5" />
                    <div className="h-2 rounded-full bg-[rgba(255,255,255,0.04)] w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        badge="Free Access"
        title="Start watching. Free."
        subtitle="No pricing. No obligation. Create a free account and access weekly briefings from four professional traders."
        primaryLabel="Create Free Account"
        primaryHref="/signup"
        secondaryLabel="Sign In"
        secondaryHref="/login"
      />

      <Footer />
    </div>
  )
}
