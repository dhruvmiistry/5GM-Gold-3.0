import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMember } from '@/lib/auth/verifyRole'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin.from('credit_balances').select('balance').eq('user_id', user.id).maybeSingle()
  return NextResponse.json({ balance: data?.balance ?? 0 })
}
