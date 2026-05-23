import { Lock, BookOpen } from 'lucide-react'
import { mockModules } from '@/lib/mockData'
import ProgressCard from '@/components/ProgressCard'

export default function GoldModulesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={13} className="text-[#c9a84c]" />
          <span className="text-[#c9a84c] text-xs font-medium uppercase tracking-wider">Gold Access Required</span>
        </div>
        <h1 className="text-2xl font-light text-white mb-2">Gold Modules</h1>
        <p className="text-[#5a5a66] text-sm max-w-lg">
          Eight structured modules from foundations to funded trader execution. Built by the full team.
        </p>
      </div>

      {/* Locked notice */}
      <div className="flex items-start gap-4 p-6 rounded-2xl bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.2)] mb-8">
        <div className="w-10 h-10 rounded-xl bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center shrink-0">
          <BookOpen size={18} className="text-[#c9a84c]" />
        </div>
        <div>
          <h3 className="text-white font-medium text-base mb-1.5">Gold access is not open yet.</h3>
          <p className="text-[#5a5a66] text-sm leading-relaxed max-w-xl">
            All eight modules are fully built and ready for Gold launch. Complete them in order, or jump to the area you need most. Every module includes video lessons, resources, and a completion certificate.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {['8 modules', '113 lessons', '45 hours of content', 'Certificates'].map(f => (
              <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.15)] text-[#8e8e9a]">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockModules.map((module, i) => (
          <ProgressCard key={module.id} module={module} index={i} />
        ))}
      </div>
    </div>
  )
}
