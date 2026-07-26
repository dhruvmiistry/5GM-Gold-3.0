import { Resend } from 'resend'
import { welcomeHtml, inviteHtml, announcementHtml, escapeHtml } from './emailTemplates'

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

export async function sendAnnouncementEmails(recipients: string[], title: string, body: string, bannerUrl?: string | null) {
  const subject = `5GM Gold — ${title}`
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
