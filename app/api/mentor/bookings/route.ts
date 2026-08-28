import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMentor } from '@/lib/auth/verifyRole'
import { NextResponse } from 'next/server'

// A mentor sees only their own assigned bookings — never the full list.
export async function GET() {
  const mentor = await verifyMentor()
  if (!mentor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('mentor_bookings')
    .select('*, member:profiles!mentor_bookings_member_id_fkey(full_name, email), mentor_booking_meeting_details(*)')
    .eq('mentor_id', mentor.id)
    .order('start_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
