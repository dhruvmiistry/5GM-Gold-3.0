import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMember } from '@/lib/auth/verifyRole'
import { getBookingMessages, sendBookingMessage, markMessagesRead, getLastReadAt } from '@/lib/mentorCalls/messages'
import { requireMentorCallsEnabled } from '@/lib/mentorCalls/featureFlag'
import { NextRequest, NextResponse } from 'next/server'

async function verifyOwnership(admin: ReturnType<typeof createAdminClient>, bookingId: string, userId: string) {
  const { data } = await admin.from('mentor_bookings').select('member_id').eq('id', bookingId).single()
  return data?.member_id === userId
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await requireMentorCallsEnabled()
  if (blocked) return blocked

  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  if (!(await verifyOwnership(admin, id, user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await getBookingMessages(admin, id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const previousReadAt = await getLastReadAt(admin, id, user.id)
  await markMessagesRead(admin, id, user.id) // viewing the thread marks it read
  return NextResponse.json({ messages: data, previousReadAt })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await requireMentorCallsEnabled()
  if (blocked) return blocked

  const user = await verifyMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  if (!(await verifyOwnership(admin, id, user.id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { body } = await request.json()
  const { data, error } = await sendBookingMessage(admin, id, user.id, body ?? '')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
