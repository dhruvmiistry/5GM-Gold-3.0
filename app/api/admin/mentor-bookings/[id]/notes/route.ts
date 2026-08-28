import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { getStaffNotes, addStaffNote } from '@/lib/mentorCalls/messages'
import { NextRequest, NextResponse } from 'next/server'

// Private staff notes — admin + assigned mentor only, never the member.
// Never referenced by any member-facing route, notification, or email.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await getStaffNotes(admin, id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { body } = await request.json()
  const { data, error } = await addStaffNote(admin, id, adminUser.id, body ?? '')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
