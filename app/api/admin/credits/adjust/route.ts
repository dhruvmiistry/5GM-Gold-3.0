import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { NextRequest, NextResponse } from 'next/server'

// Manual credit adjustment — reason is required (enforced again in the
// admin_adjust_credits() function itself, not just here).
export async function POST(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, delta, reason } = await request.json()
  if (!userId || typeof delta !== 'number' || !Number.isInteger(delta) || delta === 0) {
    return NextResponse.json({ error: 'userId and a non-zero integer delta are required' }, { status: 400 })
  }
  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: 'A reason is required for credit adjustments.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.rpc('admin_adjust_credits', {
    p_user_id: userId, p_delta: delta, p_actor_id: adminUser.id, p_reason: reason.trim(),
  })
  if (error) {
    const status = error.message.includes('insufficient_credits') ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json({ success: true })
}
