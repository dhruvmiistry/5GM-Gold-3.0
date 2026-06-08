import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const access = searchParams.get('access') ?? 'free'

  let query = supabase
    .from('videos')
    .select('id, title, slug, description, video_url, thumbnail_url, duration, category, analyst_name, access_level, release_date, created_at')
    .eq('status', 'published')
    .eq('access_level', access)
    .order('release_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
