import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMember } from '@/lib/auth/verifyRole'
import { NextResponse } from 'next/server'

const FREQUENCY_CAP_HOURS = 24

// GET: is this member eligible to see the post-video invitation right now?
// Checked server-side, not left to client-side localStorage — the 24h cap
// and the "already has a booking" / "zero credits" suppression rules are
// real business rules, not just UX conveniences.
export async function GET() {
  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const [{ data: prompt }, { data: balanceRow }, { data: profile }, { count: upcomingCount }] = await Promise.all([
    admin.from('post_video_invitation_prompts').select('last_shown_at').eq('user_id', user.id).maybeSingle(),
    admin.from('credit_balances').select('balance').eq('user_id', user.id).maybeSingle(),
    admin.from('profiles').select('plan').eq('id', user.id).single(),
    admin.from('mentor_bookings').select('id', { count: 'exact', head: true }).eq('member_id', user.id).eq('status', 'confirmed'),
  ])

  const balance = balanceRow?.balance ?? 0
  const plan = (profile?.plan ?? 'free') as 'free' | 'gold'
  const hasUpcoming = (upcomingCount ?? 0) > 0

  const withinCooldown = prompt?.last_shown_at
    ? Date.now() - new Date(prompt.last_shown_at).getTime() < FREQUENCY_CAP_HOURS * 3_600_000
    : false

  const eligible = balance > 0 && !hasUpcoming && !withinCooldown
  return NextResponse.json({ eligible, plan, balance })
}

// POST: record that the invitation was actually shown — starts the 24h cooldown.
export async function POST() {
  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  await admin.from('post_video_invitation_prompts').upsert(
    { user_id: user.id, last_shown_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  return NextResponse.json({ success: true })
}
