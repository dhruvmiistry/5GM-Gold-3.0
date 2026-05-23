import { Lock } from 'lucide-react'

interface LockedCardProps {
  title: string
  description?: string
  type?: string
  className?: string
  compact?: boolean
}

export default function LockedCard({ title, description, type, className = '', compact = false }: LockedCardProps) {
  return (
    <div className={`relative rounded-2xl overflow-hidden card ${className}`}>
      {/* Blurred content */}
      <div className="locked-blur select-none pointer-events-none">
        {compact ? (
          <div className="p-4">
            <div className="h-3 bg-[rgba(255,255,255,0.06)] rounded-full w-3/4 mb-2" />
            <div className="h-2.5 bg-[rgba(255,255,255,0.04)] rounded-full w-1/2" />
          </div>
        ) : (
          <div className="aspect-video bg-[rgba(255,255,255,0.02)] flex items-center justify-center">
            <div className="w-full h-full"
              style={{ background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.03) 0%, transparent 70%)' }}
            />
          </div>
        )}
        {!compact && (
          <div className="p-4">
            <div className="h-3 bg-[rgba(255,255,255,0.06)] rounded-full w-3/4 mb-2" />
            <div className="h-2.5 bg-[rgba(255,255,255,0.04)] rounded-full w-1/2 mb-2" />
            <div className="h-2.5 bg-[rgba(255,255,255,0.03)] rounded-full w-2/3" />
          </div>
        )}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(10,10,11,0.6)] backdrop-blur-[2px]">
        <div className="w-10 h-10 rounded-xl bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center mb-3">
          <Lock size={16} className="text-[#c9a84c]" />
        </div>
        {type && (
          <span className="text-[10px] text-[#c9a84c] font-medium tracking-widest uppercase mb-1">{type}</span>
        )}
        <p className="text-white text-sm font-medium text-center px-4 leading-snug">{title}</p>
        {description && (
          <p className="text-[#5a5a66] text-xs text-center mt-1.5 px-6 leading-relaxed">{description}</p>
        )}
        <div className="mt-4 px-4 py-2 rounded-lg bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.15)]">
          <span className="text-[#c9a84c] text-xs font-medium">Gold Access Required</span>
        </div>
      </div>
    </div>
  )
}
