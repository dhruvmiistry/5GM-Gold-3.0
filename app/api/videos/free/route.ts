import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Public free-tier video list — not user-scoped, so this uses the admin
// client (no session/cookies) rather than the cookie-bound server client.
// The cookie-bound client's queries silently trigger a Supabase session
// refresh via getSession(), which raced the browser's own independent
// refresh cycle and caused a SIGNED_OUT -> /login -> /dashboard loop for
// users clicking into Free Videos (see auth-context.tsx singleton notes).
export async function GET() {
  const supabase = createAdminClient()

  // 'published' videos are always included. 'scheduled' videos are included
  // too — even ahead of their release_date — so the Free Videos list can show
  // a countdown-locked teaser for what's coming, matching the dashboard.
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, description, thumbnail_url, duration, category, release_date, created_at, analyst_name, mux_playback_id, processing_status')
    .in('status', ['published', 'scheduled'])
    .eq('access_level', 'free')
    .eq('processing_status', 'ready')
    // Videos assigned to a module (e.g. The Reset) belong to that structured
    // course, not the standalone Free Videos library — keep the two separate.
    .is('module_id', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const now = Date.now()
  const sanitized = (data ?? []).map(v => {
    const isPending = v.release_date != null && new Date(v.release_date).getTime() > now
    // Strip the Mux playback id for anything not yet released so an early
    // client can't watch it before its countdown ends.
    return isPending ? { ...v, mux_playback_id: null } : v
  })

  // Sort by effective release date (release_date, falling back to created_at) —
  // a DB-level order by release_date alone puts undated legacy rows ahead of
  // newly-released ones instead of by actual recency.
  const sorted = sanitized.sort((a, b) =>
    new Date(b.release_date ?? b.created_at).getTime() - new Date(a.release_date ?? a.created_at).getTime())
  return NextResponse.json(sorted)
}
