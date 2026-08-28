import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { NextRequest, NextResponse } from 'next/server'

// Resets a failed job back to 'pending' — the next cron sweep (every 5
// minutes) picks it up and re-attempts the send, revalidating the booking
// fresh at that point like any other job.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notification_jobs')
    .update({ status: 'pending', scheduled_for: new Date().toISOString(), last_error: null })
    .eq('id', id)
    .eq('status', 'failed')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Job not found or not in failed status' }, { status: 404 })
  return NextResponse.json({ success: true })
}
