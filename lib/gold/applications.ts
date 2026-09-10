import { createAdminClient } from '@/lib/supabase/admin'

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
