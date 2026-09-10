import { verifyMember } from '@/lib/auth/verifyRole'
import { getMemberSafeFunnelConfig } from '@/lib/gold/funnelConfig'
import { NextResponse } from 'next/server'

// Member-auth-gated (not admin) read-only endpoint. Returns only the
// member-safe subset of gold_funnel_config — see MEMBER_SAFE_KEYS in
// lib/gold/funnelConfig.ts. call_booking_url is never included here.
export async function GET() {
  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const config = await getMemberSafeFunnelConfig()
  if (!config) return NextResponse.json({ error: 'Failed to load funnel config' }, { status: 500 })
  return NextResponse.json(config)
}
