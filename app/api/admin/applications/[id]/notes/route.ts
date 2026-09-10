import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { getApplicationActivity, addApplicationNote } from '@/lib/gold/applications'
import { NextRequest, NextResponse } from 'next/server'

// Backed by staff_audit_log (via lib/gold/applications.ts), not a dedicated
// notes table — GET returns the full activity feed (notes + every status
// change), which is exactly what StaffNotes.tsx (reused unmodified here)
// expects: a flat list of { body, author, created_at }.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { data, error } = await getApplicationActivity(admin, id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { body } = await request.json()
  const { data, error } = await addApplicationNote(admin, id, adminUser.id, body ?? '')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
