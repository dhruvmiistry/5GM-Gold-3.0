import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMember } from '@/lib/auth/verifyRole'
import { getAggregateSlotsForDate } from '@/lib/mentorCalls/availability'
import { DEFAULT_CALL_DURATION_MINUTES, MIN_NOTICE_HOURS, MAX_HORIZON_DAYS } from '@/lib/mentorCalls/config'
import { NextRequest, NextResponse } from 'next/server'

// GET ?date=YYYY-MM-DD — bookable start times for that calendar date.
export async function GET(request: NextRequest) {
  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date=YYYY-MM-DD is required' }, { status: 400 })
  }

  const requestedDate = new Date(`${date}T00:00:00Z`)
  const horizonLimit = new Date(Date.now() + MAX_HORIZON_DAYS * 86_400_000)
  if (requestedDate.getTime() > horizonLimit.getTime()) {
    return NextResponse.json([])
  }

  const admin = createAdminClient()
  const slots = await getAggregateSlotsForDate(admin, date, DEFAULT_CALL_DURATION_MINUTES)

  const noticeFloor = Date.now() + MIN_NOTICE_HOURS * 3_600_000
  const bookable = slots.filter(s => s.getTime() >= noticeFloor)

  return NextResponse.json(bookable.map(s => s.toISOString()))
}
