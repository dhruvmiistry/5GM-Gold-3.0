import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { NextRequest, NextResponse } from 'next/server'

// Explicit, admin-triggered bulk backfill — never run automatically on
// deploy. Both grant_free_credits() and enroll_gold() are idempotent
// (partial unique indexes on credit_ledger), so re-running this is safe
// and only affects users who don't already have the entitlement.
//
// type='free': grants the one-time 2 credits to every plan='free' member.
// type='gold': runs an explicit gold_enrollments + 12-credit grant for
// every CURRENT plan='gold' member (checked on the plan column itself,
// not is_gold(), since is_gold() also returns true for admins who aren't
// actually enrolled in the paid programme — they must not get credits
// merely from admin access).
export async function POST(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { type } = await request.json()
  if (type !== 'free' && type !== 'gold') {
    return NextResponse.json({ error: "type must be 'free' or 'gold'" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: users, error: fetchError } = await admin.from('profiles').select('id').eq('plan', type)
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  let granted = 0
  const errors: { userId: string; message: string }[] = []

  for (const u of users ?? []) {
    const { error } = type === 'free'
      ? await admin.rpc('grant_free_credits', { p_user_id: u.id })
      : await admin.rpc('enroll_gold', { p_user_id: u.id, p_actor_id: adminUser.id, p_note: 'Backfill: existing Gold member' })
    if (error) errors.push({ userId: u.id, message: error.message })
    else granted++
  }

  return NextResponse.json({ processed: users?.length ?? 0, granted, errors })
}
