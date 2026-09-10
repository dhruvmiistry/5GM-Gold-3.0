import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { NextRequest, NextResponse } from 'next/server'

// Same GET/PATCH shape as app/api/admin/settings/route.ts, backed by
// gold_funnel_config instead of platform_settings — this table has no
// open-read RLS policy, so call_booking_url only ever surfaces through this
// admin-gated route, never to a member session.
export async function GET() {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('gold_funnel_config').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const flattened = Object.fromEntries((data ?? []).map(row => [row.key, row.value]))
  return NextResponse.json(flattened)
}

export async function PATCH(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updates = await request.json()
  if (typeof updates !== 'object' || updates === null) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const entries = Object.entries(updates).map(([key, value]) => ({ key, value }))
  if (entries.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('gold_funnel_config').upsert(entries, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
