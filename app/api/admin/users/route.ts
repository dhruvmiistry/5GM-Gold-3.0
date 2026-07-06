import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

const PAGE_SIZE = 50

export async function GET(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id     = searchParams.get('id')
  const search = searchParams.get('search') ?? ''
  const plan   = searchParams.get('plan')   ?? 'all'
  const page   = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10))

  const admin = createAdminClient()

  if (id) {
    const { data, error } = await admin
      .from('profiles')
      .select('id,full_name,email,plan,role,access_level,trading_experience,admin_notes,banned,created_at,updated_at')
      .eq('id', id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  let query = admin
    .from('profiles')
    .select('id,full_name,email,plan,role,access_level,trading_experience,banned,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (plan !== 'all') query = query.eq('plan', plan)
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count ?? 0, page, pageSize: PAGE_SIZE })
}

const ALLOWED_PROFILE_FIELDS = new Set([
  'role', 'plan', 'access_level', 'admin_notes', 'full_name', 'trading_experience', 'banned',
])

export async function PATCH(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, updates } = await request.json()
  if (!userId || typeof updates !== 'object' || updates === null) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) => ALLOWED_PROFILE_FIELDS.has(key))
  )
  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  if (userId === adminUser.id && safeUpdates.banned === true) {
    return NextResponse.json({ error: "You can't ban your own account." }, { status: 400 })
  }

  const admin = createAdminClient()

  // Ban/unban at the Auth level too — blocks future sign-ins immediately.
  // The profiles.banned flag (checked in auth-context.tsx) is what signs
  // out an already-active session, next time it re-checks the session.
  if ('banned' in safeUpdates) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: safeUpdates.banned ? '876000h' : 'none',
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const { data, error } = await admin.from('profiles').update(safeUpdates).eq('id', userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
