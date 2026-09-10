import { verifyMember } from '@/lib/auth/verifyRole'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_EVENTS = new Set([
  'vsl_viewed', 'vsl_play_clicked', 'vsl_completed', 'apply_cta_clicked',
  'application_started',
])

// application_submitted is logged server-side by /api/gold/applications
// itself, not accepted here — a client can log everything else about its
// own funnel progress, but not fabricate the one event that actually
// matters for conversion accounting.
export async function POST(request: NextRequest) {
  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { eventType, metadata } = await request.json()
  if (!ALLOWED_EVENTS.has(eventType)) return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('gold_funnel_events').insert({
    event_type: eventType, user_id: user.id, metadata: metadata ?? {},
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
