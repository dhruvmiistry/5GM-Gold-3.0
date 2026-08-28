import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMentor } from '@/lib/auth/verifyRole'
import { isSafeMeetingUrl, saveMeetingDetails } from '@/lib/mentorCalls/meetingDetails'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mentor = await verifyMentor()
  if (!mentor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { meetingUrl, meetingId, passcode } = await request.json()

  if (meetingUrl && !isSafeMeetingUrl(meetingUrl)) {
    return NextResponse.json({ error: 'Meeting URL must be a valid http(s) link' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: booking } = await admin.from('mentor_bookings').select('mentor_id').eq('id', id).single()
  if (!booking || booking.mentor_id !== mentor.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const result = await saveMeetingDetails(admin, id, mentor.id, meetingUrl || null, meetingId || null, passcode || null)
  return NextResponse.json(result)
}
