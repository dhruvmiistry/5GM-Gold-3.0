import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMember } from '@/lib/auth/verifyRole'
import { requireMentorCallsEnabled } from '@/lib/mentorCalls/featureFlag'
import { NextResponse } from 'next/server'

export async function GET() {
  const blocked = await requireMentorCallsEnabled()
  if (blocked) return blocked

  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin.from('credit_balances').select('balance').eq('user_id', user.id).maybeSingle()
  return NextResponse.json({ balance: data?.balance ?? 0 })
}
