import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/verifyRole'
import { NextRequest, NextResponse } from 'next/server'

const PAGE_SIZE = 50

export async function GET(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id       = searchParams.get('id')
  const search   = searchParams.get('search') ?? ''
  const status   = searchParams.get('status') ?? 'all'
  const level    = searchParams.get('level') ?? 'all'
  const page     = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10))

  const admin = createAdminClient()

  if (id) {
    const { data, error } = await admin
      .from('gold_applications')
      .select('*, applicant:profiles!gold_applications_user_id_fkey(full_name, email, created_at, plan)')
      .eq('id', id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Course-engagement context for the admin lead profile — same tables
    // lib/data.ts's getResetProgress() reads for the member-facing progress bar.
    const { data: resetModule } = await admin.from('modules').select('id').eq('slug', 'the-reset').maybeSingle()
    let courseProgress: { progressPercentage: number; completedCount: number } | null = null
    if (resetModule) {
      const { data: moduleProgress } = await admin
        .from('user_module_progress')
        .select('progress_percentage')
        .eq('user_id', data.user_id)
        .eq('module_id', resetModule.id)
        .maybeSingle()
      const { count } = await admin
        .from('video_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', data.user_id)
        .eq('completed', true)
      courseProgress = { progressPercentage: moduleProgress?.progress_percentage ?? 0, completedCount: count ?? 0 }
    }

    return NextResponse.json({ ...data, courseProgress })
  }

  let query = admin
    .from('gold_applications')
    .select('id, full_name, email, phone_number, country, trading_level, commitment_level, status, submitted_at', { count: 'exact' })
    .order('submitted_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (status !== 'all') query = query.eq('status', status)
  if (level !== 'all') query = query.eq('trading_level', level)
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: statusCounts } = await admin.from('gold_applications').select('status')
  const stats = (statusCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1
    acc.total = (acc.total ?? 0) + 1
    return acc
  }, {})

  return NextResponse.json({ data, total: count ?? 0, page, pageSize: PAGE_SIZE, stats })
}
