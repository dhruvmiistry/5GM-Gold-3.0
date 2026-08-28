import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMember } from '@/lib/auth/verifyRole'
import { NextRequest, NextResponse } from 'next/server'

// Member cancels their own booking. Ownership is checked here (never
// trust a client-supplied member id) before calling cancel_booking as
// cancel_kind='member', which is what makes the 12h-cutoff refund rule
// apply — a mentor/admin cancellation uses a different route/kind.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { reason } = await request.json().catch(() => ({ reason: null }))

  const admin = createAdminClient()
  const { data: booking } = await admin.from('mentor_bookings').select('member_id').eq('id', id).single()
  if (!booking || booking.member_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await admin.rpc('cancel_booking', {
    p_booking_id: id, p_actor_id: user.id, p_cancel_kind: 'member', p_reason: reason || null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
