import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMember } from '@/lib/auth/verifyRole'
import { hasAnyMentorTemplateCoverage, isMentorFreeAt } from '@/lib/mentorCalls/availability'
import { requireMentorCallsEnabled } from '@/lib/mentorCalls/featureFlag'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await requireMentorCallsEnabled()
  if (blocked) return blocked

  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { startAt } = await request.json()
  if (!startAt) return NextResponse.json({ error: 'startAt is required' }, { status: 400 })

  const start = new Date(startAt)
  if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'startAt must be a valid future time' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: booking } = await admin
    .from('mentor_bookings')
    .select('member_id, mentor_id, duration_minutes, buffer_minutes')
    .eq('id', id)
    .single()
  if (!booking || booking.member_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const end = new Date(start.getTime() + booking.duration_minutes * 60_000)

  // If a mentor is already assigned, the new slot must actually work for
  // that specific mentor. If not yet assigned, just check the same
  // display-heuristic used at initial booking.
  const stillWorks = booking.mentor_id
    ? await isMentorFreeAt(admin, booking.mentor_id, start, end, booking.buffer_minutes)
    : await hasAnyMentorTemplateCoverage(admin, start, end)
  if (!stillWorks) {
    return NextResponse.json({ error: 'That time no longer works — please choose a different slot.' }, { status: 422 })
  }

  const { data: newBookingId, error } = await admin.rpc('reschedule_booking', {
    p_booking_id: id, p_new_start_at: start.toISOString(), p_actor_id: user.id,
  })
  if (error) {
    if (error.code === '23P01') {
      return NextResponse.json({ error: 'That slot is no longer available — please choose a different time.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ bookingId: newBookingId })
}
