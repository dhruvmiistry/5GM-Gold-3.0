import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#0a0a0b]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[rgba(201,168,76,0.12)] border border-[rgba(201,168,76,0.25)] flex items-center justify-center">
                <span className="text-[#c9a84c] font-bold text-sm">5G</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-semibold text-sm">5GM Gold</span>
                <span className="text-[#c9a84c] text-[10px] tracking-[0.15em] uppercase">Private Platform</span>
              </div>
            </div>
            <p className="text-[#5a5a66] text-sm leading-relaxed max-w-xs">
              A private trading command centre built for traders serious about refinement, discipline, and consistent execution.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-[#8e8e9a] text-xs font-semibold uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-3">
              {[
                { label: 'Free Briefings', href: '/free-access' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Login', href: '/login' },
                { label: 'Join Free', href: '/signup' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[#5a5a66] hover:text-[#8e8e9a] text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Content */}
          <div>
            <h4 className="text-[#8e8e9a] text-xs font-semibold uppercase tracking-wider mb-4">Gold Access</h4>
            <ul className="space-y-3">
              {[
                'Weekly Outlooks',
                'Live Sessions',
                'Gold Modules',
                'Strategy Vault',
                'Market Breakdowns',
              ].map(l => (
                <li key={l}>
                  <span className="text-[#5a5a66] text-sm flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[rgba(201,168,76,0.3)]" />
                    {l}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="gradient-line mb-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[#5a5a66] text-xs">
            © 2026 5GM Gold. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] pulse-glow" />
            <span className="text-[#5a5a66] text-xs">Gold access coming soon</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
