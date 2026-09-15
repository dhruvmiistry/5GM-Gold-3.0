import { createAdminClient } from '@/lib/supabase/admin'
import { sendGoldInvitedToCallEmail } from '@/lib/email'
import { getCallHost } from '@/lib/gold/callHosts'

type AdminClient = ReturnType<typeof createAdminClient>

// Notes and status-change history share one feed, both backed by the
// existing generic staff_audit_log table (no new notes table) — a plain
// free-text note is just an entry with action='note'; every status
// transition below also writes its own action here, so the admin detail
// page's timeline shows both without a separate query.
export async function logApplicationAction(
  admin: AdminClient, applicationId: string, actorId: string, action: string,
  opts: { reason?: string | null; metadata?: Record<string, unknown> } = {},
) {
  return admin.from('staff_audit_log').insert({
    actor_id: actorId,
    action,
    target_type: 'gold_application',
    target_id: applicationId,
    reason: opts.reason ?? null,
    metadata: opts.metadata ?? {},
  })
}

function describeAction(row: { action: string; reason: string | null; metadata: Record<string, unknown> }) {
  if (row.action === 'note') return typeof row.metadata.body === 'string' ? row.metadata.body : ''
  const label = row.action.replace(/_/g, ' ')
  return row.reason ? `${label} — ${row.reason}` : label
}

export async function getApplicationActivity(admin: AdminClient, applicationId: string) {
  const { data, error } = await admin
    .from('staff_audit_log')
    .select('id, actor_id, action, reason, metadata, created_at, author:profiles!staff_audit_log_actor_id_fkey(full_name, role)')
    .eq('target_type', 'gold_application')
    .eq('target_id', applicationId)
    .order('created_at', { ascending: false })
  if (error) return { data: null, error }
  const shaped = (data ?? []).map(row => ({
    id: row.id,
    author_id: row.actor_id,
    body: describeAction(row),
    created_at: row.created_at,
    author: row.author,
  }))
  return { data: shaped, error: null }
}

export async function addApplicationNote(admin: AdminClient, applicationId: string, authorId: string, body: string) {
  const trimmed = body.trim()
  if (!trimmed) return { data: null, error: new Error('Note body is required') }
  const { error } = await logApplicationAction(admin, applicationId, authorId, 'note', { metadata: { body: trimmed } })
  if (error) return { data: null, error }
  const { data: authorProfile } = await admin.from('profiles').select('full_name, role').eq('id', authorId).single()
  return {
    data: { id: crypto.randomUUID(), author_id: authorId, body: trimmed, created_at: new Date().toISOString(), author: authorProfile },
    error: null,
  }
}

// Idempotency key convention: `${applicationId}:${type}` — a repeated admin
// action (double-click, retry) is a no-op enqueue rather than a duplicate
// email, thanks to the UNIQUE constraint on gold_application_notification_jobs.
export async function enqueueGoldNotification(
  admin: AdminClient, applicationId: string, type: 'received' | 'invited_to_call' | 'accepted_week_one' | 'rejected',
) {
  return admin.from('gold_application_notification_jobs').insert({
    application_id: applicationId,
    type,
    idempotency_key: `${applicationId}:${type}`,
  })
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://5gmgold.com'

// Sends the "Invited To Call" email immediately (not queued — the cron
// sweep has a known reliability gap, see app/api/cron/process-notifications/
// route.ts) and records it the same way the queued path would, so the
// admin detail page's Emails panel shows accurate "sent X ago" status
// either way. Shared by the invite_to_call status action and the manual
// resend button so both use identical validation and send logic.
export async function sendInvitedToCallEmail(
  admin: AdminClient, applicationId: string, hostId: string,
): Promise<{ error: string | null }> {
  const host = getCallHost(hostId)
  if (!host) return { error: 'Unknown call host.' }

  const { data: application } = await admin
    .from('gold_applications').select('full_name, email').eq('id', applicationId).single()
  if (!application?.email) return { error: 'Application has no email on file.' }

  const { data: config } = await admin
    .from('gold_funnel_config').select('value').eq('key', 'call_booking_url').maybeSingle()
  const bookingUrl = typeof config?.value === 'string' ? config.value : null
  if (!bookingUrl) return { error: 'Call booking link is not configured yet — set it in Gold Desk Settings first.' }

  const dashboardUrl = `${SITE_URL}/dashboard/gold`
  const { error: sendError } = await sendGoldInvitedToCallEmail(
    application.email, application.full_name, dashboardUrl, bookingUrl, host.shortName,
  )
  if (sendError) return { error: sendError.message }

  await admin.from('gold_application_notification_jobs').upsert({
    application_id: applicationId,
    type: 'invited_to_call',
    idempotency_key: `${applicationId}:invited_to_call`,
    status: 'sent',
    sent_at: new Date().toISOString(),
    last_error: null,
  }, { onConflict: 'idempotency_key' })

  return { error: null }
}
