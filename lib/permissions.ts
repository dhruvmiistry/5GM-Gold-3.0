import { createClient } from './supabase/server'

export type UserProfile = {
  id: string
  full_name: string | null
  email: string | null
  role: 'member' | 'admin'
  plan: 'free' | 'gold'
  access_level: 'free' | 'gold'
  avatar_url: string | null
  trading_experience: string | null
  admin_notes: string | null
  signup_source: string | null
  email_consent: boolean
  marketing_opt_in: boolean
  created_at: string
  updated_at: string
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return data as UserProfile | null
  } catch {
    return null
  }
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  return profile?.role === 'admin'
}

export async function isGold(): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  return profile?.plan === 'gold' || profile?.role === 'admin'
}

export async function canAccessContent(accessLevel: 'free' | 'gold'): Promise<boolean> {
  if (accessLevel === 'free') return true
  return isGold()
}
