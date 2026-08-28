import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendRequestReceivedEmail, sendBookingConfirmedEmail, sendMentorAssignedEmail,
  sendMeetingDetailsEmail, sendBookingCancellationEmail, sendBookingRescheduleEmail,
  sendBookingReminderEmail, type BookingEmailParams,
} from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

// Vercel Cron (or a manual authenticated trigger, e.g. for local testing)
// hits this on a schedule — proposed every 5 minutes (see vercel.json).
// At-least-once delivery on that sweep interval, not exact-to-the-second —
// documented honestly rather than claiming perfect exactly-once.
export const maxDuration = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://5gmgold.com'
const DEFAULT_MEMBER_TIMEZONE = 'Europe/London' // until Phase B stores a per-member preference

type NotificationJob = {
  id: string
  booking_id: string
  type: string
  recipient_role: 'member' | 'mentor'
  recipient_id: string
  attempts: number
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: jobs, error: claimError } = await admin.rpc('claim_notification_jobs', { p_limit: 20 })
  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 })

  const results = { processed: 0, sent: 0, skipped: 0, failed: 0 }

  for (const job of (jobs ?? []) as NotificationJob[]) {
    results.processed++
    try {
      const outcome = await processJob(admin, job)
      if (outcome === 'sent') results.sent++
      else results.skipped++
    } catch (e) {
      results.failed++
      const message = e instanceof Error ? e.message : 'Unknown error'
      await admin.from('notification_jobs').update({ status: 'failed', last_error: message }).eq('id', job.id)
    }
  }

  return NextResponse.json(results)
}

async function processJob(admin: ReturnType<typeof createAdminClient>, job: NotificationJob): Promise<'sent' | 'skipped'> {
  // Revalidate fresh — never trust anything about the booking beyond its id
  // from when the job was originally enqueued.
  const { data: booking } = await admin
    .from('mentor_bookings')
    .select('*, member:profiles!mentor_bookings_member_id_fkey(full_name, email), mentor:profiles!mentor_bookings_mentor_id_fkey(full_name, email)')
    .eq('id', job.booking_id)
    .single()

  if (!booking) {
    await admin.from('notification_jobs').update({ status: 'skipped', last_error: 'booking no longer exists' }).eq('id', job.id)
    return 'skipped'
  }

  // Reminders lose their meaning if the booking moved on since they were
  // queued (cancelled/completed/no-show) — everything else (confirmation,
  // assignment, cancellation notice itself, reschedule notice) is a record
  // of something that already happened and stays valid to send late.
  const isReminder = job.type === 'reminder_24h' || job.type === 'reminder_1h'
  if (isReminder && booking.status !== 'confirmed') {
    await admin.from('notification_jobs').update({ status: 'skipped', last_error: `booking status is ${booking.status}` }).eq('id', job.id)
    return 'skipped'
  }

  const recipient = job.recipient_role === 'member' ? booking.member : booking.mentor
  if (!recipient?.email) {
    await admin.from('notification_jobs').update({ status: 'skipped', last_error: 'recipient has no email' }).eq('id', job.id)
    return 'skipped'
  }

  let mentorTimezone = DEFAULT_MEMBER_TIMEZONE
  if (booking.mentor_id) {
    const { data: mentorProfile } = await admin.from('mentor_profiles').select('timezone').eq('profile_id', booking.mentor_id).single()
    if (mentorProfile) mentorTimezone = mentorProfile.timezone
  }

  const isForMentor = job.recipient_role === 'mentor'
  const params: BookingEmailParams = {
    recipientName: recipient.full_name ?? recipient.email.split('@')[0],
    otherPartyName: isForMentor
      ? (booking.member?.full_name ?? booking.member?.email ?? 'Member')
      : (booking.mentor?.full_name ?? 'To be confirmed'),
    otherPartyLabel: isForMentor ? 'Member' : 'Mentor',
    startAt: new Date(booking.start_at),
    durationMinutes: booking.duration_minutes,
    timezone: isForMentor ? mentorTimezone : DEFAULT_MEMBER_TIMEZONE,
    manageUrl: isForMentor ? `${SITE_URL}/mentor` : `${SITE_URL}/dashboard/mentor-calls`,
  }

  let meetingDetails: { meeting_url: string | null; meeting_id: string | null; passcode: string | null } | null = null
  if (job.type === 'meeting_details' || isReminder) {
    const { data } = await admin.from('mentor_booking_meeting_details').select('meeting_url, meeting_id, passcode').eq('booking_id', job.booking_id).maybeSingle()
    meetingDetails = data ?? null
  }

  let refunded = false
  if (job.type === 'cancellation') {
    // The refund fact lives in credit_ledger, not on the booking row itself.
    const { data } = await admin.from('credit_ledger').select('id').eq('booking_id', job.booking_id).eq('reason', 'booking_refund').maybeSingle()
    refunded = !!data
  }

  const { error: sendError } = await dispatch(job.type, recipient.email, params, booking, meetingDetails, refunded)
  if (sendError) throw new Error(sendError.message)

  await admin.from('notification_jobs').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', job.id)
  return 'sent'
}

async function dispatch(
  type: string, to: string, params: BookingEmailParams,
  booking: { trading_experience: string | null; main_challenge: string | null; discuss_topic: string | null },
  meetingDetails: { meeting_url: string | null; meeting_id: string | null; passcode: string | null } | null,
  refunded: boolean,
) {
  switch (type) {
    case 'request_received':
      return sendRequestReceivedEmail(to, params)
    case 'booking_confirmed':
      return sendBookingConfirmedEmail(to, params)
    case 'mentor_assigned':
      return sendMentorAssignedEmail(to, params, {
        tradingExperience: booking.trading_experience, mainChallenge: booking.main_challenge, discussTopic: booking.discuss_topic,
      })
    case 'meeting_details':
      if (!meetingDetails?.meeting_url) return { error: null } // nothing to send — see meeting-details route's own enqueue guard
      return sendMeetingDetailsEmail(to, params, meetingDetails.meeting_url, meetingDetails.meeting_id, meetingDetails.passcode)
    case 'cancellation':
      return sendBookingCancellationEmail(to, params, refunded)
    case 'reschedule':
      return sendBookingRescheduleEmail(to, params)
    case 'reminder_24h':
      return sendBookingReminderEmail(to, params, '24 hours', meetingDetails?.meeting_url)
    case 'reminder_1h':
      return sendBookingReminderEmail(to, params, '1 hour', meetingDetails?.meeting_url)
    default:
      return { error: new Error(`Unknown notification type: ${type}`) }
  }
}
