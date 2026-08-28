import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMentor } from '@/lib/auth/verifyRole'
import { getStaffNotes, addStaffNote } from '@/lib/mentorCalls/messages'
import { NextRequest, NextResponse } from 'next/server'

async function verifyOwnership(admin: ReturnType<typeof createAdminClient>, bookingId: string, mentorId: string) {
  const { data } = await admin.from('mentor_bookings').select('mentor_id').eq('id', bookingId).single()
  return data?.mentor_id === mentorId
}

// Private staff notes — visible to the CURRENTLY assigned mentor only,
// never the member, and never surfaced past reassignment.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mentor = await verifyMentor()
  if (!mentor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  if (!(await verifyOwnership(admin, id, mentor.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await getStaffNotes(admin, id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mentor = await verifyMentor()
  if (!mentor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  if (!(await verifyOwnership(admin, id, mentor.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { body } = await request.json()
  const { data, error } = await addStaffNote(admin, id, mentor.id, body ?? '')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
