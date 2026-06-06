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

  // ── Fetch profile from Supabase and set user ──────────
  const fetchAndSetUser = async () => {
    if (!SUPABASE_CONFIGURED) return

    try {
      const { createClient } = await import('./supabase/client')
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setUser(null); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profile) {
        setUser(profileToUser(profile, authUser.email ?? ''))
      }
    } catch {
      setUser(null)
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

        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && mounted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (profile && mounted) setUser(profileToUser(profile, session.user.email ?? ''))
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            if (profile) setUser(profileToUser(profile, session.user.email ?? ''))
          } else {
            setUser(null)
          }
        })

        if (mounted) setIsLoading(false)
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
    await fetchAndSetUser()
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
      if (error.message.includes('User already registered')) throw new Error('An account with this email already exists.')
      if (error.message.includes('Password should be'))      throw new Error('Password must be at least 8 characters.')
      if (error.message.includes('Unable to validate'))      throw new Error('Invalid email address.')
      if (error.message.includes('Too many requests'))       throw new Error('Too many signups from this device. Please try again later.')
      throw new Error(error.message)
    }

    // If email confirmation is required, Supabase returns a user with no session
    if (data.user && !data.session) {
      setPendingConfirmation(true)
      return
    }

    await fetchAndSetUser()
    router.push('/dashboard')
  }

  const logout = async () => {
    if (!SUPABASE_CONFIGURED) {
      localStorage.removeItem(MOCK_KEY)
      setUser(null)
      window.location.href = '/'
      return
    }
    const { createClient } = await import('./supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  const refreshUser = async () => {
    await fetchAndSetUser()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, pendingConfirmation, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
