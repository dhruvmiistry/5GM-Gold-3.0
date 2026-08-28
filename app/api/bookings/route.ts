import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMember } from '@/lib/auth/verifyRole'
import { hasAnyMentorTemplateCoverage } from '@/lib/mentorCalls/availability'
import { DEFAULT_CALL_DURATION_MINUTES, MIN_NOTICE_HOURS } from '@/lib/mentorCalls/config'
import { NextRequest, NextResponse } from 'next/server'

// GET: the calling member's own bookings.
export async function GET() {
  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('mentor_bookings')
    .select('*, mentor:profiles!mentor_bookings_mentor_id_fkey(full_name), mentor_booking_meeting_details(*)')
    .eq('member_id', user.id)
    .order('start_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: request a call. No mentor picker — start_at/duration only.
export async function POST(request: NextRequest) {
  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { startAt, tradingExperience, mainChallenge, discussTopic, idempotencyKey } = body
  if (!startAt) return NextResponse.json({ error: 'startAt is required' }, { status: 400 })

  const start = new Date(startAt)
  if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'startAt must be a valid future time' }, { status: 400 })
  }
  if (start.getTime() < Date.now() + MIN_NOTICE_HOURS * 3_600_000) {
    return NextResponse.json({ error: `Bookings need at least ${MIN_NOTICE_HOURS} hours' notice.` }, { status: 400 })
  }
  const end = new Date(start.getTime() + DEFAULT_CALL_DURATION_MINUTES * 60_000)

  const admin = createAdminClient()

  const covered = await hasAnyMentorTemplateCoverage(admin, start, end)
  if (!covered) {
    return NextResponse.json({ error: 'No mentor is available at that time — please choose a different slot.' }, { status: 422 })
  }

  const { data: bookingId, error } = await admin.rpc('create_booking', {
    p_member_id: user.id,
    p_start_at: start.toISOString(),
    p_duration_minutes: DEFAULT_CALL_DURATION_MINUTES,
    p_trading_experience: tradingExperience || null,
    p_main_challenge: mainChallenge || null,
    p_discuss_topic: discussTopic || null,
    p_idempotency_key: idempotencyKey || null,
  })

  if (error) {
    if (error.message.includes('insufficient_credits')) {
      return NextResponse.json({ error: "You don't have any call credits available." }, { status: 402 })
    }
    if (error.message.includes('upcoming_booking_limit_reached')) {
      return NextResponse.json({ error: 'You already have an upcoming call booked.' }, { status: 409 })
    }
    if (error.code === '23P01') {
      return NextResponse.json({ error: 'That slot is no longer available — please choose a different time.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookingId })
}
