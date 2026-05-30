import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('videos')
    .select('id, title, description, thumbnail_url, duration, category, release_date, analyst_name, mux_playback_id, processing_status')
    .eq('status', 'published')
    .eq('access_level', 'free')
    .eq('processing_status', 'ready')
    .order('release_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
