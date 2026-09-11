import { verifyMember } from '@/lib/auth/verifyRole'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getFunnelState } from '@/lib/gold/funnelConfig'
import { enqueueGoldNotification } from '@/lib/gold/applications'
import { NextRequest, NextResponse } from 'next/server'

// Returns the caller's own most recent application (or null) — lets the
// apply page/dashboard show "already applied" state instead of re-submitting.
export async function GET() {
  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gold_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

const REQUIRED_FIELDS = ['fullName', 'email', 'phoneNumber', 'country', 'isOver18'] as const

// Final submit only — no draft rows. All prior steps (details, phone,
// trading profile, questions) are held entirely in client state, same as
// MentorCallsClient.tsx's BookingFlow. Phone number is collected but not
// verified — no SMS/OTP step; phone_verified stays false on every row.
export async function POST(request: NextRequest) {
  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const state = await getFunnelState()
  if (state !== 'applications_open') {
    return NextResponse.json({ error: 'Applications are not currently open.' }, { status: 400 })
  }

  const body = await request.json()
  for (const key of REQUIRED_FIELDS) {
    if (body[key] === undefined || body[key] === null || body[key] === '') {
      return NextResponse.json({ error: `${key} is required` }, { status: 400 })
    }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('gold_applications')
    .insert({
      user_id: user.id,
      full_name: body.fullName,
      email: body.email,
      phone_number: body.phoneNumber,
      country: body.country,
      is_over_18: !!body.isOver18,
      trading_experience: body.tradingExperience ?? null,
      markets_traded: body.marketsTraded ?? [],
      trading_level: body.tradingLevel ?? null,
      prop_firm_funded: !!body.propFirmFunded,
      funded_capital: body.fundedCapital ?? null,
      personal_account: !!body.personalAccount,
      biggest_challenge: body.biggestChallenge ?? null,
      why_join: body.whyJoin ?? null,
      programme_goal: body.programmeGoal ?? null,
      current_obstacle: body.currentObstacle ?? null,
      commitment_level: body.commitmentLevel ?? null,
      employment_status: body.employmentStatus ?? null,
      twelve_month_goal: body.twelveMonthGoal ?? null,
      lifetime_memberships: body.lifetimeMemberships ?? [],
      additional_information: body.additionalInformation ?? null,
    })
    .select()
    .single()

  if (error) {
    // uq_gold_applications_active_user — one active application per user
    if (error.code === '23505') return NextResponse.json({ error: 'You already have an active application.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await enqueueGoldNotification(admin, data.id, 'received')
  await admin.from('gold_funnel_events').insert({ event_type: 'application_submitted', user_id: user.id, application_id: data.id })

  return NextResponse.json(data)
}
