import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { NextRequest, NextResponse } from 'next/server'

// GET: all bookings, filterable by mentor, member, status, and date range.
// Pass ?needsMentor=1 for the assignment queue (confirmed, unassigned).
export async function GET(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const mentorId = searchParams.get('mentorId')
  const memberId = searchParams.get('memberId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const needsMentor = searchParams.get('needsMentor')

  const admin = createAdminClient()
  let query = admin
    .from('mentor_bookings')
    .select(`
      *,
      member:profiles!mentor_bookings_member_id_fkey(full_name, email),
      mentor:profiles!mentor_bookings_mentor_id_fkey(full_name, email),
      mentor_booking_meeting_details(meeting_url, meeting_id, passcode)
    `)
    .order('start_at', { ascending: true })

  if (needsMentor) query = query.eq('status', 'confirmed').is('mentor_id', null)
  else if (status) query = query.eq('status', status)
  if (mentorId) query = query.eq('mentor_id', mentorId)
  if (memberId) query = query.eq('member_id', memberId)
  if (from) query = query.gte('start_at', from)
  if (to) query = query.lte('start_at', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
