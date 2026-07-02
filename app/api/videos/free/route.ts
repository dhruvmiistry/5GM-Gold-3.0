import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // A 'scheduled' video becomes watchable automatically once its release_date
  // has passed — no manual "publish" step needed. 'published' videos are
  // always included regardless of release_date.
  const nowIso = new Date().toISOString()

  const { data, error } = await supabase
    .from('videos')
    .select('id, title, description, thumbnail_url, duration, category, release_date, created_at, analyst_name, mux_playback_id, processing_status')
    .or(`status.eq.published,and(status.eq.scheduled,release_date.lte.${nowIso})`)
    .eq('access_level', 'free')
    .eq('processing_status', 'ready')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Sort by effective release date (release_date, falling back to created_at) —
  // a DB-level order by release_date alone puts undated legacy rows ahead of
  // newly-released ones instead of by actual recency.
  const sorted = (data ?? []).sort((a, b) =>
    new Date(b.release_date ?? b.created_at).getTime() - new Date(a.release_date ?? a.created_at).getTime())
  return NextResponse.json(sorted)
}
