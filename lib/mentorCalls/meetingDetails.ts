import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

// Only http(s) — rejects javascript:, data:, and anything else unsafe to
// hand back to a browser as a clickable link.
export function isSafeMeetingUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

// Saves meeting details and enqueues a 'meeting_details' notification only
// when the content actually changed (hash comparison against
// last_notified_hash) — a retried or no-op save doesn't re-notify.
export async function saveMeetingDetails(
  admin: SupabaseClient,
  bookingId: string,
  updatedBy: string,
  meetingUrl: string | null,
  meetingId: string | null,
  passcode: string | null,
): Promise<{ notified: boolean }> {
  const hash = createHash('sha256').update(JSON.stringify({ meetingUrl, meetingId, passcode })).digest('hex')

  const { data: existing } = await admin
    .from('mentor_booking_meeting_details')
    .select('last_notified_hash')
    .eq('booking_id', bookingId)
    .maybeSingle()

  await admin.from('mentor_booking_meeting_details').upsert(
    { booking_id: bookingId, meeting_url: meetingUrl, meeting_id: meetingId, passcode, updated_by: updatedBy, updated_at: new Date().toISOString() },
    { onConflict: 'booking_id' },
  )

  if (existing?.last_notified_hash === hash) {
    return { notified: false }
  }

  const { data: booking } = await admin.from('mentor_bookings').select('member_id, mentor_id, status').eq('id', bookingId).single()
  if (!booking || booking.status !== 'confirmed' || !meetingUrl) {
    // Nothing worth notifying about yet (booking isn't live, or the link
    // was cleared rather than set) — still record the hash so a later
    // real change is detected correctly.
    await admin.from('mentor_booking_meeting_details').update({ last_notified_hash: hash }).eq('booking_id', bookingId)
    return { notified: false }
  }

  const now = new Date().toISOString()
  const rows = [
    { booking_id: bookingId, type: 'meeting_details', recipient_role: 'member', recipient_id: booking.member_id, scheduled_for: now, idempotency_key: `${bookingId}:meeting_details:member:${hash}` },
    ...(booking.mentor_id ? [{ booking_id: bookingId, type: 'meeting_details', recipient_role: 'mentor', recipient_id: booking.mentor_id, scheduled_for: now, idempotency_key: `${bookingId}:meeting_details:mentor:${hash}` }] : []),
  ]
  await admin.from('notification_jobs').upsert(rows, { onConflict: 'idempotency_key', ignoreDuplicates: true })
  await admin.from('mentor_booking_meeting_details').update({ last_notified_hash: hash }).eq('booking_id', bookingId)

  return { notified: true }
}
