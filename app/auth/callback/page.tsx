'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Deliberately a client page, not a route.ts handler. Email "Safe Links" scanners
// (Outlook Defender, corporate mail gateways) prefetch confirmation links via plain
// HTTP GET to scan for phishing — a server route handler would burn the single-use
// PKCE code on that prefetch, before the real user ever clicks. Scanners don't run
// JS, so doing the exchange here (client-side, on mount) means it only fires for an
// actual browser visit.
function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const code = searchParams.get('code')
    const rawNext = searchParams.get('next') ?? '/dashboard'
    const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

    if (!code) {
      router.replace('/login?error=confirmation_failed')
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error('[auth/callback] exchangeCodeForSession failed:', error.message, error)
        router.replace('/login?error=confirmation_failed')
        return
      }
      router.replace(next)
    })
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <Loader2 size={22} className="text-[#c9a84c] animate-spin" />
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
          <Loader2 size={22} className="text-[#c9a84c] animate-spin" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  )
}
