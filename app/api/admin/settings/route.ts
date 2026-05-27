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

export async function GET() {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('platform_settings').select('*').order('key')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Convert array of {key, value} to flat object
  const settings: Record<string, unknown> = {}
  for (const row of data ?? []) settings[row.key] = row.value
  return NextResponse.json(settings)
}

export async function PATCH(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updates: Record<string, unknown> = await request.json()
  const admin = createAdminClient()

  const upserts = Object.entries(updates).map(([key, value]) => ({ key, value }))
  const { error } = await admin.from('platform_settings').upsert(upserts, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
