import { Lock, Shield, FileText } from 'lucide-react'
import { mockStrategyVault } from '@/lib/mockData'

const typeIcons: Record<string, React.ElementType> = {
  Playbook: FileText,
  Framework: Shield,
  Model: Shield,
  Manual: FileText,
  Protocol: Shield,
  Reference: FileText,
}

export default function StrategyVaultPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={13} className="text-[#c9a84c]" />
          <span className="text-[#c9a84c] text-xs font-medium uppercase tracking-wider">Gold Access Required</span>
        </div>
        <h1 className="text-2xl font-light text-white mb-2">Strategy Vault</h1>
        <p className="text-[#5a5a66] text-sm max-w-lg">
          Playbooks, execution models, frameworks, and reference documents from the full team.
        </p>
      </div>

      {/* Locked banner */}
      <div className="p-8 rounded-2xl bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.2)] mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center mx-auto mb-4">
          <Shield size={22} className="text-[#c9a84c]" />
        </div>
        <h3 className="text-white font-semibold text-xl mb-2">Premium resources coming soon.</h3>
        <p className="text-[#5a5a66] text-sm leading-relaxed max-w-md mx-auto">
          Complete playbooks, execution models, cheat sheets, and trade frameworks built by the team. Available exclusively to Gold members.
        </p>
      </div>

      {/* Resource grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockStrategyVault.map(item => {
          const Icon = typeIcons[item.type] || FileText
          return (
            <div key={item.id} className="relative rounded-xl card overflow-hidden group">
              <div className="locked-blur p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.12)] flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-[#c9a84c]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5a5a66] uppercase tracking-wider">{item.type}</span>
                    <h3 className="text-[#8e8e9a] font-medium text-sm mt-0.5">{item.title}</h3>
                  </div>
                </div>
                <p className="text-[#5a5a66] text-xs leading-relaxed">{item.description}</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(10,10,11,0.55)] backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-1.5">
                  <Lock size={14} className="text-[#c9a84c]" />
                  <span className="text-[11px] text-[#c9a84c] font-medium">Gold</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
