import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMentor } from '@/lib/auth/verifyRole'
import { NextRequest, NextResponse } from 'next/server'

// Mentors can mark the outcome of their own assigned calls — completed or
// no-show — but not cancel/reschedule (admin-only per the brief's capability
// split).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mentor = await verifyMentor()
  if (!mentor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { outcome } = await request.json()
  if (outcome !== 'complete' && outcome !== 'no_show') {
    return NextResponse.json({ error: "outcome must be 'complete' or 'no_show'" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: booking } = await admin.from('mentor_bookings').select('mentor_id').eq('id', id).single()
  if (!booking || booking.mentor_id !== mentor.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await admin.rpc(outcome === 'complete' ? 'mark_completed' : 'mark_no_show', { p_booking_id: id, p_actor_id: mentor.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
