import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Server-authoritative check — reads platform_settings fresh every call,
// deliberately uncached. A cache here is exactly the kind of thing that
// could leave mutations reachable for a window after an admin disables the
// flag; a single-row lookup by primary key is cheap enough not to need one.
// Fails closed: missing key, malformed value, or a query error all resolve
// to false, never true.
export async function isMentorCallsEnabled(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'mentor_calls_enabled')
      .maybeSingle()
    if (error || !data) return false
    return data.value === true
  } catch {
    return false
  }
}

// Drop-in guard for member-facing API routes:
//   const blocked = await requireMentorCallsEnabled()
//   if (blocked) return blocked
// Returns a generic 404 — indistinguishable from the resource genuinely
// not existing, so a disabled-feature response never confirms the
// feature's existence to an unauthorized prober.
export async function requireMentorCallsEnabled(): Promise<NextResponse | null> {
  const enabled = await isMentorCallsEnabled()
  if (!enabled) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return null
}
