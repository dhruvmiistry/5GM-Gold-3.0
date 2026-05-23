import { Lock, Radio, Calendar, Clock } from 'lucide-react'
import { mockLiveSessions } from '@/lib/mockData'

export default function LiveSessionsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={13} className="text-[#c9a84c]" />
          <span className="text-[#c9a84c] text-xs font-medium uppercase tracking-wider">Gold Access Required</span>
        </div>
        <h1 className="text-2xl font-light text-white mb-2">Live Sessions</h1>
        <p className="text-[#5a5a66] text-sm max-w-lg">
          Live trading room sessions, mentorship rooms, and replay archives. Available to Gold members.
        </p>
      </div>

      {/* Live room coming soon */}
      <div className="p-8 rounded-2xl bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.2)] mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center mx-auto mb-4">
          <Radio size={22} className="text-[#c9a84c]" />
        </div>
        <h3 className="text-white font-semibold text-xl mb-2">Live mentorship room coming soon.</h3>
        <p className="text-[#5a5a66] text-sm leading-relaxed max-w-md mx-auto mb-6">
          Weekly live sessions with the full team. Pre-market analysis, live trade breakdowns, and real-time Q&A. Gold access required.
        </p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.2)]">
          <span className="live-dot" />
          <span className="text-[#c9a84c] text-sm font-medium">Live room launching with Gold access</span>
        </div>
      </div>

      {/* Upcoming schedule */}
      <div className="mb-8">
        <h2 className="text-white font-medium text-lg mb-5 flex items-center gap-2">
          <Calendar size={16} className="text-[#c9a84c]" />
          Upcoming Schedule
        </h2>
        <div className="space-y-4">
          {mockLiveSessions.map(session => (
            <div key={session.id} className="relative rounded-2xl card overflow-hidden">
              <div className="locked-blur p-5">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center">
                      <Radio size={18} className="text-[#5a5a66]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-[#5a5a66] border border-[rgba(255,255,255,0.07)]">{session.recurring}</span>
                    </div>
                    <h3 className="text-[#8e8e9a] font-medium text-sm mb-1">{session.title}</h3>
                    <p className="text-[#5a5a66] text-xs leading-relaxed mb-3">{session.description}</p>
                    <div className="flex items-center gap-4 text-xs text-[#5a5a66]">
                      <span className="flex items-center gap-1"><Calendar size={11} />{session.date}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{session.time} · {session.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(10,10,11,0.55)] backdrop-blur-[1px]">
                <span className="text-xs text-[#c9a84c] bg-[rgba(10,10,11,0.8)] px-4 py-2 rounded-full border border-[rgba(201,168,76,0.25)]">
                  Gold Access Required
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Replay archive */}
      <div>
        <h2 className="text-white font-medium text-lg mb-5">Replay Archive</h2>
        <div className="p-8 rounded-2xl card text-center">
          <Lock size={20} className="text-[#5a5a66] mx-auto mb-3" />
          <h3 className="text-[#8e8e9a] font-medium text-base mb-2">Session replays locked</h3>
          <p className="text-[#5a5a66] text-sm">All live session recordings will be available here for Gold members to rewatch at any time.</p>
        </div>
      </div>
    </div>
  )
}
