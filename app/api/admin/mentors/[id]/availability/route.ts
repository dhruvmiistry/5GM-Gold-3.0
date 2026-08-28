import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { NextRequest, NextResponse } from 'next/server'

// GET: this mentor's weekly template + upcoming overrides.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const [{ data: weekly, error: weeklyError }, { data: overrides, error: overridesError }] = await Promise.all([
    admin.from('mentor_weekly_availability').select('*').eq('mentor_id', id).order('day_of_week'),
    admin.from('mentor_availability_overrides').select('*').eq('mentor_id', id).gte('date', new Date().toISOString().slice(0, 10)).order('date'),
  ])
  if (weeklyError) return NextResponse.json({ error: weeklyError.message }, { status: 500 })
  if (overridesError) return NextResponse.json({ error: overridesError.message }, { status: 500 })
  return NextResponse.json({ weekly, overrides })
}

// POST: add either a weekly window ({ type: 'weekly', dayOfWeek, startTime,
// endTime }) or a date override ({ type: 'override', date, kind, startTime?,
// endTime?, note? }).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()

  if (body.type === 'weekly') {
    const { dayOfWeek, startTime, endTime } = body
    if (dayOfWeek == null || !startTime || !endTime) {
      return NextResponse.json({ error: 'dayOfWeek, startTime and endTime are required' }, { status: 400 })
    }
    const { data, error } = await admin.from('mentor_weekly_availability')
      .insert({ mentor_id: id, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (body.type === 'override') {
    const { date, kind, startTime, endTime, note } = body
    if (!date || !kind) return NextResponse.json({ error: 'date and kind are required' }, { status: 400 })
    const { data, error } = await admin.from('mentor_availability_overrides')
      .upsert({ mentor_id: id, date, kind, start_time: startTime || null, end_time: endTime || null, note: note || null }, { onConflict: 'mentor_id,date' })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: "type must be 'weekly' or 'override'" }, { status: 400 })
}

// DELETE: ?type=weekly&rowId=<uuid> or ?type=override&rowId=<uuid>
export async function DELETE(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const rowId = searchParams.get('rowId')
  if (!rowId || (type !== 'weekly' && type !== 'override')) {
    return NextResponse.json({ error: 'type and rowId are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const table = type === 'weekly' ? 'mentor_weekly_availability' : 'mentor_availability_overrides'
  const { error } = await admin.from(table).delete().eq('id', rowId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
