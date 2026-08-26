import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#0a0a0b]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Image src="/logo.png" alt="5GM Gold" width={120} height={40} className="h-8 w-auto object-contain" />
            </div>
            <p className="text-[#5a5a66] text-sm leading-relaxed max-w-xs">
              A free 20-lesson course from the 5GM mentors, built to reset your trading foundations — plus a private platform for those ready to go further.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-[#8e8e9a] text-xs font-semibold uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-3">
              {[
                { label: 'The Reset', href: '/#platform' },
                { label: 'Free Videos', href: '/free-access' },
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

        </div>

        <div className="gradient-line mb-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[#5a5a66] text-xs">
            © 2026 5GM Gold. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <Image
              src="/pbw.png"
              alt="Powered by WebPlug"
              width={400}
              height={38}
              className="h-4 w-auto object-contain opacity-30 hover:opacity-55 transition-opacity duration-300"
            />
          </div>
        </div>
      </div>
    </footer>
  )
}
