import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { NextRequest, NextResponse } from 'next/server'

// GET: list existing mentor_profiles (joined with account name/email).
// Pass ?search=<query> instead to search candidate accounts to promote
// (existing profiles, any role) rather than list current mentors.
export async function GET(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const admin = createAdminClient()

  if (search !== null) {
    if (!search.trim()) return NextResponse.json([])
    const { data, error } = await admin
      .from('profiles')
      .select('id, full_name, email, role')
      .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      .neq('role', 'mentor')
      .limit(20)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await admin
    .from('mentor_profiles')
    .select('*, profiles!mentor_profiles_profile_id_fkey(full_name, email, role)')
    .order('sort_order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: assign an existing account as a mentor (atomic role + profile
// creation via the assign_as_mentor RPC).
export async function POST(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { profileId, displayName, bio, imageUrl, specialty, timezone } = body
  if (!profileId || !displayName) {
    return NextResponse.json({ error: 'profileId and displayName are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.rpc('assign_as_mentor', {
    p_profile_id: profileId,
    p_actor_id: adminUser.id,
    p_display_name: displayName,
    p_bio: bio || null,
    p_image_url: imageUrl || null,
    p_specialty: Array.isArray(specialty) ? specialty : [],
    p_timezone: timezone || 'Europe/London',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
