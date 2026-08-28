import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { getBookingMessages, sendBookingMessage, markMessagesRead, getLastReadAt } from '@/lib/mentorCalls/messages'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await getBookingMessages(admin, id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const previousReadAt = await getLastReadAt(admin, id, adminUser.id)
  await markMessagesRead(admin, id, adminUser.id)
  return NextResponse.json({ messages: data, previousReadAt })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { body } = await request.json()
  const { data, error } = await sendBookingMessage(admin, id, adminUser.id, body ?? '')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
