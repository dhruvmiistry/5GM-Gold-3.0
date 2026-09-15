import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { logApplicationAction, sendInvitedToCallEmail } from '@/lib/gold/applications'
import {
  sendGoldApplicationReceivedEmail,
  sendGoldAcceptedWeekOneEmail, sendGoldApplicationRejectedEmail,
} from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://5gmgold.com'
const EMAIL_TYPES = ['received', 'invited_to_call', 'accepted_week_one', 'rejected'] as const
type EmailType = (typeof EMAIL_TYPES)[number]

// History for the admin "Emails" panel — same rows the cron processor
// (app/api/cron/process-notifications/route.ts) writes to, read-only here.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('gold_application_notification_jobs')
    .select('id, type, status, attempts, last_error, created_at, sent_at')
    .eq('application_id', id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Admin-triggered send/resend. Sends inline (doesn't wait for the 5-minute
// cron sweep) so the admin gets an immediate result, then upserts the same
// row the automatic flow would have written — one history row per type,
// not a growing log, keyed on the same idempotency_key convention as
// enqueueGoldNotification in lib/gold/applications.ts.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { type } = await request.json()
  if (!EMAIL_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${EMAIL_TYPES.join(', ')}` }, { status: 400 })
  }

  const admin = createAdminClient()

  // invited_to_call reuses whichever host was picked when the invite was
  // first sent (recorded on the application row) — resend never prompts
  // for a host again, same as it never prompts for anything else.
  if (type === 'invited_to_call') {
    const { data: application } = await admin.from('gold_applications').select('call_host_id').eq('id', id).single()
    if (!application?.call_host_id) {
      return NextResponse.json({ error: 'No call host was assigned yet — use Invite To Call first.' }, { status: 400 })
    }
    const { error: sendError } = await sendInvitedToCallEmail(admin, id, application.call_host_id)
    if (sendError) return NextResponse.json({ error: sendError }, { status: 502 })
    await logApplicationAction(admin, id, adminUser.id, 'email_sent', { metadata: { type } })
    return NextResponse.json({ success: true })
  }

  const { data: application } = await admin.from('gold_applications').select('full_name, email').eq('id', id).single()
  if (!application?.email) return NextResponse.json({ error: 'Application has no email on file' }, { status: 400 })

  const dashboardUrl = `${SITE_URL}/dashboard/gold`
  let sendError: { message: string } | null = null

  switch (type as Exclude<EmailType, 'invited_to_call'>) {
    case 'received': {
      ({ error: sendError } = await sendGoldApplicationReceivedEmail(application.email, application.full_name, dashboardUrl))
      break
    }
    case 'accepted_week_one': {
      ({ error: sendError } = await sendGoldAcceptedWeekOneEmail(application.email, application.full_name, dashboardUrl))
      break
    }
    case 'rejected': {
      ({ error: sendError } = await sendGoldApplicationRejectedEmail(application.email, application.full_name, dashboardUrl))
      break
    }
  }

  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 502 })

  const { error: logError } = await admin.from('gold_application_notification_jobs').upsert({
    application_id: id,
    type,
    idempotency_key: `${id}:${type}`,
    status: 'sent',
    sent_at: new Date().toISOString(),
    last_error: null,
  }, { onConflict: 'idempotency_key' })
  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 })

  await logApplicationAction(admin, id, adminUser.id, 'email_sent', { metadata: { type } })

  return NextResponse.json({ success: true })
}
