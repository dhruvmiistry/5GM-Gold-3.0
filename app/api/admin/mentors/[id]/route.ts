import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_FIELDS = new Set([
  'display_name', 'bio', 'image_url', 'specialty', 'timezone', 'active',
  'call_duration_minutes', 'buffer_minutes', 'min_notice_hours', 'max_horizon_days', 'sort_order',
])

// PATCH: update a mentor's own bookable settings (duration, buffer, notice,
// horizon, timezone, active flag, etc). Direct table write — RLS already
// scopes this to admins (or the mentor themself, for the self-serve route).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const updates = await request.json()
  const safeUpdates = Object.fromEntries(Object.entries(updates).filter(([key]) => ALLOWED_FIELDS.has(key)))
  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from('mentor_profiles').update(safeUpdates).eq('profile_id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: revoke the mentor role (refuses if they still have future
// confirmed bookings — see remove_mentor()'s guard).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.rpc('remove_mentor', { p_profile_id: id, p_actor_id: adminUser.id })
  if (error) {
    const status = error.message.includes('mentor_has_future_bookings') ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json({ success: true })
}
