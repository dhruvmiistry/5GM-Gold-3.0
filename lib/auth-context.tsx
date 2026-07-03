'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  id: string
  name: string           // maps to full_name
  email: string
  role: 'member' | 'admin'
  plan: 'free' | 'gold'
  accountType: 'free' | 'gold'  // alias for plan — keeps existing components working
  access_level: 'free' | 'gold'
  experience: string     // maps to trading_experience
  joinedDate: string     // maps to created_at
  avatar_url?: string | null
  email_consent?: boolean
  marketing_opt_in?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  pendingConfirmation: boolean   // true after signup if email confirmation is required
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, experience: string) => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const SUPABASE_CONFIGURED = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
)

// ── Mock fallback (no Supabase env) ──────────────────────
const MOCK_KEY = '5gm_gold_user'

function mockUserFromData(data: { id: string; name: string; email: string; experience: string }): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: 'member',
    plan: 'free',
    accountType: 'free',
    access_level: 'free',
    experience: data.experience,
    joinedDate: new Date().toISOString(),
  }
}

// ── Profile → User mapper ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function profileToUser(profile: any, email: string): User {
  return {
    id: profile.id,
    name: profile.full_name || email.split('@')[0],
    email: profile.email || email,
    role: profile.role ?? 'member',
    plan: profile.plan ?? 'free',
    accountType: profile.plan ?? 'free',
    access_level: profile.access_level ?? 'free',
    experience: profile.trading_experience ?? '',
    joinedDate: profile.created_at ?? new Date().toISOString(),
    avatar_url: profile.avatar_url ?? null,
    email_consent: profile.email_consent ?? false,
    marketing_opt_in: profile.marketing_opt_in ?? false,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)
  const router = useRouter()

  // ── Shared helper: fetch profile row, create it if missing ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function minimalUserFromSession(authUser: any): User {
    return {
      id: authUser.id,
      name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Member',
      email: authUser.email ?? '',
      role: 'member',
      plan: 'free',
      accountType: 'free',
      access_level: 'free',
      experience: authUser.user_metadata?.trading_experience ?? '',
      joinedDate: authUser.created_at ?? new Date().toISOString(),
      avatar_url: null,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function fetchOrCreateProfile(supabase: any, authUser: any) {
    const makeTimer = (ms: number) => new Promise<{ data: null }>(r => setTimeout(() => r({ data: null }), ms))

    const { data: profile } = await Promise.race([
      supabase.from('profiles').select('*').eq('id', authUser.id).single(),
      makeTimer(5000),
    ]) as { data: unknown }

    if (profile) return profile

    // Profile missing — new user, try to create it
    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.email?.split('@')[0] ||
      'Member'
    const { data: newProfile } = await Promise.race([
      supabase.from('profiles').insert({
        id: authUser.id,
        email: authUser.email,
        full_name: fullName,
        trading_experience: authUser.user_metadata?.trading_experience ?? null,
        signup_source: authUser.user_metadata?.signup_source ?? 'web',
      }).select().single(),
      makeTimer(5000),
    ]) as { data: unknown }

    return newProfile ?? null
  }

  // ── Retry the profile fetch in the background with backoff ──
  // Used whenever fetchOrCreateProfile times out — keeps retrying instead of
  // leaving the user stuck on minimal session data (name/plan/role) until a
  // manual refresh, which is more likely to happen when the DB is under load.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function scheduleProfileRetry(supabase: any, userId: string, email: string, isMounted: () => boolean, onUser: (u: User) => void) {
    const delays = [1500, 4000, 8000]
    let attempt = 0
    const tryFetch = async () => {
      if (!isMounted()) return
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
        if (data) { if (isMounted()) onUser(profileToUser(data, email)); return }
      } catch {}
      if (++attempt < delays.length && isMounted()) setTimeout(tryFetch, delays[attempt])
    }
    setTimeout(tryFetch, delays[0])
  }

  // ── Fetch profile and set user (called after login / refreshUser) ─
  const fetchAndSetUser = async () => {
    if (!SUPABASE_CONFIGURED) return

    try {
      const { createClient } = await import('./supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setUser(null); return }

      const profile = await fetchOrCreateProfile(supabase, session.user)
      // Fall back to session data if profile timed out — ensures dashboard
      // never sees user=null after a successful login
      setUser(profile
        ? profileToUser(profile, session.user.email ?? '')
        : minimalUserFromSession(session.user)
      )
    } catch {
      // silent — leave existing state intact
    }
  }

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      // Mock mode
      try {
        const stored = localStorage.getItem(MOCK_KEY)
        if (stored) setUser(JSON.parse(stored))
      } catch {}
      setIsLoading(false)
      return
    }

    // Supabase mode — hydrate from session
    let mounted = true

    const init = async () => {
      try {
        const { createClient } = await import('./supabase/client')
        const supabase = createClient()

        // Use onAuthStateChange instead of getUser() for initialisation.
        // INITIAL_SESSION fires immediately from the local cookie with no network
        // call, so the UI resolves in milliseconds instead of waiting for a server
        // round-trip. Supabase then silently validates/refreshes the token in the
        // background — if the token is expired it fires SIGNED_OUT (which also
        // clears the cookie, breaking any proxy redirect loop).
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!mounted) return

            // Never call another supabase-js method (fetchOrCreateProfile etc.)
            // synchronously inside this callback — it needs the current session,
            // which contends for the same internal auth lock this callback is
            // running under, and stalls for several seconds until our own
            // Promise.race timeout gives up. Defer to the next tick to release
            // the lock first. (Known supabase-js gotcha, not a network/DB issue.)

            // INITIAL_SESSION resolves from the cached cookie with no network call —
            // unblock the UI immediately with minimal session data instead of making
            // the spinner wait on the profile DB round-trip, then upgrade in the
            // background once the full profile arrives.
            if (event === 'INITIAL_SESSION') {
              if (session?.user) {
                setUser(minimalUserFromSession(session.user))
                setIsLoading(false)
                const retry = () => scheduleProfileRetry(supabase, session.user.id, session.user.email ?? '', () => mounted, setUser)
                setTimeout(async () => {
                  if (!mounted) return
                  try {
                    const profile = await fetchOrCreateProfile(supabase, session.user)
                    if (!mounted) return
                    if (profile) setUser(profileToUser(profile, session.user.email ?? ''))
                    else retry()
                  } catch {
                    retry()
                  }
                }, 0)
              } else {
                setUser(null)
                setIsLoading(false)
              }
              return
            }

            setTimeout(async () => {
              if (!mounted) return
              try {
                if (session?.user) {
                  const profile = await fetchOrCreateProfile(supabase, session.user)
                  if (!mounted) return
                  if (profile) {
                    setUser(profileToUser(profile, session.user.email ?? ''))
                  } else {
                    // Profile timed out — show minimal user to unblock the UI,
                    // then retry in the background to pick up the real role/plan
                    setUser(minimalUserFromSession(session.user))
                    scheduleProfileRetry(supabase, session.user.id, session.user.email ?? '', () => mounted, setUser)
                  }
                } else {
                  if (mounted) setUser(null)
                }
              } catch {
                // profile fetch failed — leave user as-is
              }
            }, 0)
          }
        )

        return () => subscription.unsubscribe()
      } catch {
        if (mounted) setIsLoading(false)
      }
    }

    init()
    return () => { mounted = false }
  }, [])

  const login = async (email: string, password: string) => {
    if (!SUPABASE_CONFIGURED) {
      await new Promise(r => setTimeout(r, 700))
      const mockUser = mockUserFromData({
        id: 'usr_' + Math.random().toString(36).slice(2, 8),
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email,
        experience: 'intermediate',
      })
      localStorage.setItem(MOCK_KEY, JSON.stringify(mockUser))
      setUser(mockUser)
      router.push('/dashboard')
      return
    }

    const { createClient } = await import('./supabase/client')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) {
      if (error.message.includes('Invalid login credentials')) throw new Error('Incorrect email or password.')
      if (error.message.includes('Email not confirmed'))       throw new Error('Please confirm your email before signing in.')
      if (error.message.includes('Too many requests'))         throw new Error('Too many attempts. Please wait a few minutes.')
      throw new Error(error.message)
    }
    // Don't await fetchAndSetUser() here — the SIGNED_IN event from onAuthStateChange
    // already handles fetching the profile and setting user state
    router.push('/dashboard')
  }

  const signup = async (name: string, email: string, password: string, experience: string) => {
    if (!SUPABASE_CONFIGURED) {
      await new Promise(r => setTimeout(r, 900))
      const mockUser = mockUserFromData({
        id: 'usr_' + Math.random().toString(36).slice(2, 8),
        name, email, experience,
      })
      localStorage.setItem(MOCK_KEY, JSON.stringify(mockUser))
      setUser(mockUser)
      router.push('/dashboard')
      return
    }

    const { createClient } = await import('./supabase/client')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: name.trim(), trading_experience: experience, signup_source: 'web' },
      },
    })
    if (error) {
      // Only fires for accounts that are already confirmed — for an unconfirmed
      // account, signUp() on the same email instead 200s and issues a fresh
      // confirmation token (rate-limited below), it does not error.
      if (error.message.includes('User already registered')) throw new Error('An account with this email already exists.')
      if (error.message.includes('Password should be'))      throw new Error('Password must be at least 8 characters.')
      if (error.message.includes('Unable to validate'))      throw new Error('Invalid email address.')
      if (error.message.includes('you can only request this after') || error.message.includes('rate limit'))
        throw new Error('A confirmation email was already sent — check your inbox, or wait a moment and try again.')
      if (error.message.includes('Too many requests'))       throw new Error('Too many signups from this device. Please try again later.')
      throw new Error(error.message)
    }

    // If email confirmation is required, Supabase returns a user with no session
    if (data.user && !data.session) {
      setPendingConfirmation(true)
      return
    }

    // Don't await fetchAndSetUser() here — SIGNED_IN event handles it
    router.push('/dashboard')
  }

  // Sends a fresh confirmation link with a new token (invalidating the old one) —
  // the way out for a user whose original link expired or never arrived. Same
  // email-send rate limit bucket as signUp() (default: one send per ~60s).
  const resendConfirmation = async (email: string) => {
    if (!SUPABASE_CONFIGURED) {
      await new Promise(r => setTimeout(r, 600))
      return
    }
    const { createClient } = await import('./supabase/client')
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() })
    if (error) {
      if (error.message.includes('already confirmed'))   throw new Error('This email is already confirmed. Please sign in.')
      if (error.message.includes('you can only request this after') || error.message.includes('rate limit'))
        throw new Error('Please wait a minute before requesting another email.')
      throw new Error(error.message)
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!SUPABASE_CONFIGURED) {
      await new Promise(r => setTimeout(r, 600))
      return
    }
    if (!user?.email) throw new Error('You must be signed in to change your password.')

    const { createClient } = await import('./supabase/client')
    const supabase = createClient()

    // Re-verify the current password before allowing a change — updateUser()
    // works off the active session alone, so without this check anyone with
    // an unattended open session could lock the real owner out.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (verifyError) throw new Error('Current password is incorrect.')

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      if (error.message.includes('Password should be')) throw new Error('Password must be at least 8 characters.')
      if (error.message.includes('different from the old password')) throw new Error('New password must be different from your current password.')
      throw new Error(error.message)
    }
  }

  const logout = async () => {
    try {
      if (!SUPABASE_CONFIGURED) {
        localStorage.removeItem(MOCK_KEY)
      } else {
        const { createClient } = await import('./supabase/client')
        const supabase = createClient()
        await supabase.auth.signOut({ scope: 'global' })
      }
    } catch {
      // ignore signout errors
    } finally {
      setUser(null)
      window.location.href = '/'
    }
  }

  const refreshUser = async () => {
    await fetchAndSetUser()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, pendingConfirmation, login, signup, resendConfirmation, changePassword, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
