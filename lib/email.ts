import { Resend } from 'resend'
import {
  welcomeHtml, inviteHtml, announcementHtml, escapeHtml,
  requestReceivedHtml, bookingConfirmedHtml, mentorAssignedHtml, meetingDetailsHtml,
  bookingCancellationHtml, bookingRescheduleHtml, bookingReminderHtml,
} from './emailTemplates'

export interface BookingEmailParams {
  recipientName: string
  otherPartyName: string
  otherPartyLabel: string
  startAt: Date
  durationMinutes: number
  timezone: string
  manageUrl: string
}

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@5gmgold.com'

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to 5GM Gold',
    html: welcomeHtml(name),
  })
}

export async function sendAdminInviteEmail(to: string, tempPassword: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'You\'ve been granted access to 5GM Gold',
    html: inviteHtml(to, tempPassword),
  })
}

// Resend's batch endpoint caps out at 100 emails per call, and (unlike a
// single send with multiple `to`) each recipient only ever sees their own
// address — no BCC-style leakage of the full member list.
const BATCH_SIZE = 100

export async function sendAnnouncementEmails(recipients: string[], subject: string, title: string, body: string, bannerUrl?: string | null) {
  const html = announcementHtml(escapeHtml(title), escapeHtml(body), bannerUrl)
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE)
    // resend.batch.send() resolves with { data, error } — it does not throw
    // on API-level failures (bad key, unverified domain, etc.), so that
    // field has to be checked explicitly or a failed send looks identical
    // to a successful one.
    const { error } = await resend.batch.send(chunk.map(to => ({ from: FROM, to, subject, html })))
    if (error) throw new Error(error.message)
  }
}

// ── Mentor call booking emails ─────────────────────────────────────────
// Same pattern as sendWelcomeEmail above — thin wrapper, caller checks
// the returned { error } explicitly (Resend doesn't throw on API-level
// failures). Subjects deliberately carry no booking-specific details
// (no member answers, no meeting links) — sensitive content stays in the
// body only.

export async function sendRequestReceivedEmail(to: string, params: Omit<BookingEmailParams, 'otherPartyName' | 'otherPartyLabel'>) {
  return resend.emails.send({
    from: FROM, to, subject: '5GM Gold — request received',
    html: requestReceivedHtml(params),
  })
}

export async function sendBookingConfirmedEmail(to: string, params: BookingEmailParams) {
  return resend.emails.send({
    from: FROM, to, subject: "5GM Gold — you're confirmed",
    html: bookingConfirmedHtml(params),
  })
}

export async function sendMentorAssignedEmail(
  to: string, params: BookingEmailParams,
  context: { tradingExperience?: string | null; mainChallenge?: string | null; discussTopic?: string | null },
) {
  return resend.emails.send({
    from: FROM, to, subject: '5GM Gold — new call assigned',
    html: mentorAssignedHtml(params, context),
  })
}

export async function sendMeetingDetailsEmail(to: string, params: BookingEmailParams, meetingUrl: string, meetingId?: string | null, passcode?: string | null) {
  return resend.emails.send({
    from: FROM, to, subject: '5GM Gold — how to join your call',
    html: meetingDetailsHtml(params, meetingUrl, meetingId, passcode),
  })
}

export async function sendBookingCancellationEmail(to: string, params: BookingEmailParams, refunded: boolean) {
  return resend.emails.send({
    from: FROM, to, subject: '5GM Gold — call cancelled',
    html: bookingCancellationHtml(params, refunded),
  })
}

export async function sendBookingRescheduleEmail(to: string, params: BookingEmailParams) {
  return resend.emails.send({
    from: FROM, to, subject: '5GM Gold — call rescheduled',
    html: bookingRescheduleHtml(params),
  })
}

export async function sendBookingReminderEmail(to: string, params: BookingEmailParams, leadLabel: '24 hours' | '1 hour', meetingUrl?: string | null) {
  return resend.emails.send({
    from: FROM, to, subject: `5GM Gold — call in ${leadLabel}`,
    html: bookingReminderHtml(params, leadLabel, meetingUrl),
  })
}
