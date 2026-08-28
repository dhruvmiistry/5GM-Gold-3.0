import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { isMentorFreeAt } from '@/lib/mentorCalls/availability'
import { isSafeMeetingUrl, saveMeetingDetails } from '@/lib/mentorCalls/meetingDetails'
import { NextRequest, NextResponse } from 'next/server'

// Consolidated admin actions on one booking — action-based body rather than
// several separate route files, matching this codebase's PATCH{id,updates}
// convention while keeping the RPC calls this wraps explicit and separate.
// Body: { action: 'assign'|'cancel'|'reschedule'|'complete'|'no_show'|'meeting_details', ... }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()

  switch (body.action) {
    case 'assign': {
      const { mentorId } = body
      if (!mentorId) return NextResponse.json({ error: 'mentorId is required' }, { status: 400 })

      const { data: booking } = await admin.from('mentor_bookings').select('start_at, end_at, buffer_minutes').eq('id', id).single()
      if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const { data: mentorProfile } = await admin.from('mentor_profiles').select('buffer_minutes').eq('profile_id', mentorId).single()
      const free = await isMentorFreeAt(
        admin, mentorId, new Date(booking.start_at), new Date(booking.end_at), mentorProfile?.buffer_minutes ?? 15
      )
      if (!free) return NextResponse.json({ error: 'That mentor is not available at this time.' }, { status: 409 })

      const { error } = await admin.rpc('assign_mentor', { p_booking_id: id, p_mentor_id: mentorId, p_actor_id: adminUser.id })
      if (error) {
        const status = error.code === '23P01' ? 409 : 500
        return NextResponse.json({ error: error.message }, { status })
      }
      return NextResponse.json({ success: true })
    }

    case 'cancel': {
      const { reason, noMentorAvailable } = body
      const { error } = await admin.rpc('cancel_booking', {
        p_booking_id: id, p_actor_id: adminUser.id,
        p_cancel_kind: noMentorAvailable ? 'no_mentor_available' : 'mentor_admin',
        p_reason: reason || null,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    case 'reschedule': {
      const { startAt } = body
      if (!startAt) return NextResponse.json({ error: 'startAt is required' }, { status: 400 })
      const { data: newBookingId, error } = await admin.rpc('reschedule_booking', {
        p_booking_id: id, p_new_start_at: new Date(startAt).toISOString(), p_actor_id: adminUser.id,
      })
      if (error) {
        const status = error.code === '23P01' ? 409 : 500
        return NextResponse.json({ error: error.message }, { status })
      }
      return NextResponse.json({ bookingId: newBookingId })
    }

    case 'complete': {
      const { error } = await admin.rpc('mark_completed', { p_booking_id: id, p_actor_id: adminUser.id })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    case 'no_show': {
      const { error } = await admin.rpc('mark_no_show', { p_booking_id: id, p_actor_id: adminUser.id })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    case 'meeting_details': {
      const { meetingUrl, meetingId, passcode } = body
      if (meetingUrl && !isSafeMeetingUrl(meetingUrl)) {
        return NextResponse.json({ error: 'Meeting URL must be a valid http(s) link' }, { status: 400 })
      }
      const result = await saveMeetingDetails(admin, id, adminUser.id, meetingUrl || null, meetingId || null, passcode || null)
      return NextResponse.json(result)
    }

    default:
      return NextResponse.json({ error: "action must be one of: assign, cancel, reschedule, complete, no_show, meeting_details" }, { status: 400 })
  }
}
