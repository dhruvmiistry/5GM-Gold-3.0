import { createAdminClient } from '@/lib/supabase/admin'
import { verifyDeveloper } from '@/lib/auth/verifyRole'
import { NextRequest, NextResponse } from 'next/server'

// Dedicated, audit-logged toggle for the mentor_calls_enabled release flag.
// Deliberately NOT routed through the generic /api/admin/settings PATCH —
// that endpoint has no audit trail, and flipping this specific flag is
// significant enough (unlocks booking/credits/messaging for every member)
// to warrant its own actor/timestamp record in staff_audit_log.
//
// Locked to verifyDeveloper(), not verifyAdmin() — there are 6 admin-role
// accounts in production, but this control is meant for the developer
// alone. Both GET and POST are gated, not just the mutation, so other
// admins get a plain 403 and the admin UI can hide the whole card rather
// than showing a toggle that then fails when clicked.
export async function GET() {
  const devUser = await verifyDeveloper()
  if (!devUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const [{ data: setting }, { data: history }] = await Promise.all([
    admin.from('platform_settings').select('value').eq('key', 'mentor_calls_enabled').maybeSingle(),
    admin
      .from('staff_audit_log')
      .select('actor_id, created_at, metadata, actor:profiles!staff_audit_log_actor_id_fkey(full_name, email)')
      .eq('action', 'mentor_calls_flag_changed')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return NextResponse.json({
    enabled: setting?.value === true,
    history: history ?? [],
  })
}

export async function POST(request: NextRequest) {
  const devUser = await verifyDeveloper()
  if (!devUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { enabled } = await request.json().catch(() => ({}))
  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: current } = await admin.from('platform_settings').select('value').eq('key', 'mentor_calls_enabled').maybeSingle()
  const previousValue = current?.value === true

  if (previousValue === enabled) {
    return NextResponse.json({ success: true, enabled, unchanged: true })
  }

  const { error: upsertError } = await admin
    .from('platform_settings')
    .upsert({ key: 'mentor_calls_enabled', value: enabled }, { onConflict: 'key' })
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

  const { error: auditError } = await admin.from('staff_audit_log').insert({
    actor_id: devUser.id,
    action: 'mentor_calls_flag_changed',
    target_type: 'platform_settings',
    target_id: null,
    metadata: { key: 'mentor_calls_enabled', previous_value: previousValue, new_value: enabled },
  })
  if (auditError) return NextResponse.json({ error: auditError.message }, { status: 500 })

  return NextResponse.json({ success: true, enabled })
}
