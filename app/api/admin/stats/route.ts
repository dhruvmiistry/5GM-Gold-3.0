import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalUsers },
    { count: freeUsers },
    { count: goldUsers },
    { count: newSignups },
    { count: totalVideos },
    { count: totalModules },
    { data: upcomingSessions },
    { data: recentUsers },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'free'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'gold'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    admin.from('videos').select('*', { count: 'exact', head: true }),
    admin.from('modules').select('*', { count: 'exact', head: true }),
    admin.from('live_sessions').select('id, title, host_name, session_time, status').eq('status', 'upcoming').order('session_time').limit(3),
    admin.from('profiles').select('id, full_name, email, plan, role, created_at').order('created_at', { ascending: false }).limit(8),
  ])

  return NextResponse.json({
    totalUsers, freeUsers, goldUsers, newSignups,
    totalVideos, totalModules, upcomingSessions, recentUsers,
  })
}
