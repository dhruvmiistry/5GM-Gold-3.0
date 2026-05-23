import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'green' | 'red' | 'muted' | 'outline' | 'new'
  className?: string
}

export default function Badge({ children, variant = 'muted', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide',
        variant === 'gold' && 'bg-[rgba(201,168,76,0.12)] text-[#c9a84c] border border-[rgba(201,168,76,0.25)]',
        variant === 'green' && 'bg-[rgba(76,175,125,0.12)] text-[#4caf7d] border border-[rgba(76,175,125,0.25)]',
        variant === 'red' && 'bg-[rgba(232,87,87,0.12)] text-[#e85757] border border-[rgba(232,87,87,0.25)]',
        variant === 'muted' && 'bg-[rgba(255,255,255,0.05)] text-[#8e8e9a] border border-[rgba(255,255,255,0.08)]',
        variant === 'outline' && 'bg-transparent text-[#8e8e9a] border border-[rgba(255,255,255,0.12)]',
        variant === 'new' && 'bg-[rgba(201,168,76,0.15)] text-[#e8c96d] border border-[rgba(201,168,76,0.3)] font-semibold',
        className,
      )}
    >
      {children}
    </span>
  )
}
