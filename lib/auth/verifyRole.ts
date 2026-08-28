import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

// Shared role-verification for API routes — mirrors the verifyAdmin()
// pattern copy-pasted across app/api/admin/*/route.ts (cookie-authenticated
// client, one profiles.role lookup), extended with a mentor variant so new
// routes don't need a 12th copy of the same four lines.

async function getAuthedProfile(): Promise<{ user: User; role: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) return null
  return { user, role: profile.role }
}

export async function verifyAdmin(): Promise<User | null> {
  const authed = await getAuthedProfile()
  return authed?.role === 'admin' ? authed.user : null
}

export async function verifyMentor(): Promise<User | null> {
  const authed = await getAuthedProfile()
  return authed?.role === 'mentor' ? authed.user : null
}

// Admins can also act on mentor-scoped routes (support/testing) without
// being given a mentor_profiles row of their own.
export async function verifyAdminOrMentor(): Promise<User | null> {
  const authed = await getAuthedProfile()
  return authed?.role === 'admin' || authed?.role === 'mentor' ? authed.user : null
}

// Confirms the caller is a real, authenticated member acting on their own
// behalf — used by member-facing booking routes so a client can never
// supply someone else's user id.
export async function verifyMember(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
}
