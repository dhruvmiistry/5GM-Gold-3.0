import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { logApplicationAction, enqueueGoldNotification, sendInvitedToCallEmail } from '@/lib/gold/applications'
import { getCallHost } from '@/lib/gold/callHosts'
import { NextRequest, NextResponse } from 'next/server'

const STATUS_ACTIONS: Record<string, string> = {
  mark_reviewing: 'reviewing',
  qualify: 'qualified',
  reject: 'rejected',
  invite_to_call: 'invited_to_call',
  accept_week_one: 'accepted_week_one',
  archive: 'archived',
  // Undo for Reject/Archive/Accept/Invite — always lands back on 'reviewing'
  // regardless of where it came from, never on invited_to_call/accepted_week_one/
  // rejected, so it can never re-trigger the emails those statuses send.
  revert: 'reviewing',
}

// invited_to_call is deliberately absent here — it sends immediately via
// sendInvitedToCallEmail instead of going through this queued path.
const NOTIFICATION_FOR_STATUS: Partial<Record<string, 'accepted_week_one' | 'rejected'>> = {
  accepted_week_one: 'accepted_week_one',
  rejected: 'rejected',
}

// Consolidated admin actions on one application — action-based body, same
// convention as app/api/admin/mentor-bookings/[id]/route.ts. Every branch
// writes to staff_audit_log (via logApplicationAction) so the admin detail
// page's activity feed shows the full history.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()

  if (body.action === 'score') {
    const { score } = body
    if (typeof score !== 'number' || score < 1 || score > 10) {
      return NextResponse.json({ error: 'score must be between 1 and 10' }, { status: 400 })
    }
    const { error } = await admin.from('gold_applications').update({ qualification_score: score }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logApplicationAction(admin, id, adminUser.id, 'scored', { metadata: { score } })
    return NextResponse.json({ success: true })
  }

  const newStatus = STATUS_ACTIONS[body.action]
  if (!newStatus) {
    return NextResponse.json(
      { error: 'action must be one of: mark_reviewing, qualify, reject, invite_to_call, accept_week_one, archive, revert, score' },
      { status: 400 },
    )
  }

  // Explicit, admin-controlled lock (gold_funnel_config.invite_to_call_enabled,
  // migration 022) — deliberately not derived from call_booking_url being
  // set, since that gets filled in for testing before the real booking
  // backend exists.
  let callHostId: string | null = null
  if (body.action === 'invite_to_call') {
    const { data: flag } = await admin.from('gold_funnel_config').select('value').eq('key', 'invite_to_call_enabled').maybeSingle()
    if (flag?.value !== true) {
      return NextResponse.json({ error: 'Invite To Call is locked — enable it in Gold Desk Settings once the booking backend is ready.' }, { status: 403 })
    }
    const host = getCallHost(body.hostId)
    if (!host) return NextResponse.json({ error: 'Pick who is hosting the call first.' }, { status: 400 })
    callHostId = host.profileId
  }

  const updates: Record<string, unknown> = { status: newStatus, reviewed_at: new Date().toISOString() }
  if (callHostId) updates.call_host_id = callHostId
  const { data, error } = await admin.from('gold_applications').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logApplicationAction(admin, id, adminUser.id, body.action, { reason: body.reason ?? null })

  // invite_to_call sends immediately (see sendInvitedToCallEmail) rather
  // than going through the queued path — accepted_week_one/rejected still
  // queue for the cron sweep as before.
  if (body.action === 'invite_to_call') {
    const { error: sendError } = await sendInvitedToCallEmail(admin, id, body.hostId)
    if (sendError) return NextResponse.json({ error: `Status updated, but the email failed to send: ${sendError}` }, { status: 502 })
  } else {
    const notificationType = NOTIFICATION_FOR_STATUS[newStatus]
    if (notificationType) await enqueueGoldNotification(admin, id, notificationType)
  }

  return NextResponse.json(data)
}

// Admin-only, permanent. Distinct from the 'archive' status action — this
// actually removes the row (gold_application_notification_jobs cascades,
// gold_funnel_events.application_id is set null) so uq_gold_applications_active_user
// no longer blocks the same user from submitting a fresh application.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()

  const { data: existing, error: fetchError } = await admin
    .from('gold_applications')
    .select('id, full_name, email')
    .eq('id', id)
    .single()
  if (fetchError || !existing) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const { error } = await admin.from('gold_applications').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Logged after the delete succeeds — target_id has no FK, so the audit
  // trail is free to outlive the row it describes, same as any other action.
  await logApplicationAction(admin, id, adminUser.id, 'deleted', {
    metadata: { full_name: existing.full_name, email: existing.email },
  })

  return NextResponse.json({ success: true })
}
