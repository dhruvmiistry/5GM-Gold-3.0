/**
 * Data fetching layer — tries Supabase first, falls back to mock data.
 * All functions are safe to call from client components via useEffect.
 */

import {
  mockFreeVideos,
  mockAnnouncements,
  mockLiveSessions,
  mockModules,
  mockMarketBreakdowns,
  mockStrategyVault,
  mockRevisionMaterials,
  type Video,
  type Announcement,
  type LiveSession,
  type Module,
} from './mockData'

const SUPABASE_CONFIGURED = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
)

async function getSupabase() {
  const { createClient } = await import('./supabase/client')
  return createClient()
}

// ── Map Supabase video row → Video interface ──────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVideo(row: any): Video {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    thumbnail: row.thumbnail_url ?? (row.mux_playback_id ? `https://image.mux.com/${row.mux_playback_id}/thumbnail.jpg?width=640&height=360&time=5` : null),
    duration: parseDuration(row.duration),
    category: row.category ?? 'General',
    releaseDate: row.release_date ?? row.created_at,
    trader: row.analyst_name ?? 'Analyst',
    free: row.access_level === 'free',
    locked: row.access_level === 'gold',
    views: 0,
  }
}

function parseDuration(d: string | null): number {
  if (!d) return 0
  const parts = d.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return parseInt(d) || 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAnnouncement(row: any): Announcement {
  const published = row.published_at ?? row.created_at
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    date: published,
    type: 'platform',
    isNew: published ? new Date(published).getTime() > sevenDaysAgo : false,
    bannerUrl: row.banner_url ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLiveSession(row: any): LiveSession {
  const d = new Date(row.session_time)
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    duration: '60 min',
    trader: row.host_name ?? 'Analyst',
    locked: row.access_level === 'gold',
    recurring: '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapModule(row: any): Module {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    lessons: 0,
    duration: '',
    locked: row.access_level === 'gold',
    progress: 0,
  }
}

// ── Public API ────────────────────────────────────────────

// Teaser fields only — deliberately excludes mux_playback_id/mux_asset_id so a
// video scheduled-but-not-yet-released can be shown with a countdown without
// exposing anything a client could use to watch it early. Actual playback
// access is gated separately in app/api/videos/free/route.ts.
const FREE_VIDEO_TEASER_COLUMNS = 'id, title, description, thumbnail_url, duration, category, release_date, created_at, analyst_name, access_level'

export async function getFreeVideos(): Promise<Video[]> {
  if (!SUPABASE_CONFIGURED) return mockFreeVideos
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('videos')
      .select(FREE_VIDEO_TEASER_COLUMNS)
      .eq('access_level', 'free')
      // Videos assigned to a module (e.g. The Reset) belong to that structured
      // course, not the standalone Free Videos library — keep the two separate.
      .is('module_id', null)
      .in('status', ['published', 'scheduled'])
    // Supabase is configured, so an error or a genuinely empty result is real
    // production state, not "not set up yet" — don't mask it behind placeholder
    // mock titles (this previously showed users unreleased mock videos like
    // "FX Pairs — EUR/USD & GBP/JPY Review" whenever the query errored or a
    // transient auth hiccup returned no rows).
    if (error || !data) { if (error) console.error('getFreeVideos failed:', error.message); return [] }
    // Sort by effective release date (release_date, falling back to created_at —
    // same fallback mapVideo uses for display). Doing this in JS rather than via
    // .order('release_date') because a plain DB-level sort puts legacy rows with
    // no release_date ahead of newly-scheduled ones instead of by actual recency.
    return data.map(mapVideo).sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
  } catch (e) { console.error('getFreeVideos failed:', e); return [] }
}

export async function getAllVideos(): Promise<Video[]> {
  if (!SUPABASE_CONFIGURED) return [...mockFreeVideos, ...mockMarketBreakdowns]
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('status', 'published')
      .order('release_date', { ascending: false })
    if (error) { console.error('getAllVideos failed:', error.message); return [] }
    return (data ?? []).map(mapVideo)
  } catch (e) { console.error('getAllVideos failed:', e); return [] }
}

export async function getMarketBreakdowns(): Promise<Video[]> {
  if (!SUPABASE_CONFIGURED) return mockMarketBreakdowns
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('category', 'Market Breakdown')
      .eq('status', 'published')
      .order('release_date', { ascending: false })
    if (error) { console.error('getMarketBreakdowns failed:', error.message); return [] }
    return (data ?? []).map(mapVideo)
  } catch (e) { console.error('getMarketBreakdowns failed:', e); return [] }
}

export async function getAnnouncements(): Promise<Announcement[]> {
  if (!SUPABASE_CONFIGURED) return mockAnnouncements
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false })
    if (error) { console.error('getAnnouncements failed:', error.message); return [] }
    return (data ?? []).map(mapAnnouncement)
  } catch (e) { console.error('getAnnouncements failed:', e); return [] }
}

export async function getLiveSessions(): Promise<LiveSession[]> {
  if (!SUPABASE_CONFIGURED) return mockLiveSessions
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .order('session_time', { ascending: true })
    if (error) { console.error('getLiveSessions failed:', error.message); return [] }
    return (data ?? []).map(mapLiveSession)
  } catch (e) { console.error('getLiveSessions failed:', e); return [] }
}

export async function getModules(): Promise<Module[]> {
  if (!SUPABASE_CONFIGURED) return mockModules
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
    if (error) { console.error('getModules failed:', error.message); return [] }
    return (data ?? []).map(mapModule)
  } catch (e) { console.error('getModules failed:', e); return [] }
}

// ── The Reset (free 20-lesson course) ──────────────────────
// Modeled on the existing modules/videos schema — no dedicated tables.
// The course is a `modules` row (slug: 'the-reset') whose lessons are
// `videos` rows with matching module_id, ordered by the explicit
// `sort_order` column (release_date can't express a fixed curriculum order).

export interface ResetLessonVideo {
  id: string
  title: string
  description: string
  thumbnail: string | null
  muxPlaybackId: string | null
  duration: number
  analyst: string
  stage: string
  sortOrder: number
  releaseDate: string | null
  isLocked: boolean
}

export interface ResetModuleData {
  id: string
  title: string
  description: string
  lessons: ResetLessonVideo[]
  launchAt: string | null // earliest still-future releaseDate among locked lessons, for the countdown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapResetLesson(row: any, now: number): ResetLessonVideo {
  const isLocked = row.status === 'scheduled' && row.release_date != null && new Date(row.release_date).getTime() > now
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    thumbnail: row.thumbnail_url ?? (row.mux_playback_id ? `https://image.mux.com/${row.mux_playback_id}/thumbnail.jpg?width=640&height=360&time=5` : null),
    // Same anti-bypass measure as the Free Videos route (app/api/videos/free/route.ts):
    // strip the playback id for anything still locked so an early client can't play it.
    muxPlaybackId: isLocked ? null : (row.mux_playback_id ?? null),
    duration: parseDuration(row.duration),
    analyst: row.analyst_name ?? 'Analyst',
    stage: row.category ?? 'The Reset',
    sortOrder: row.sort_order ?? 0,
    releaseDate: row.release_date ?? null,
    isLocked,
  }
}

// Returns null if the course hasn't been set up in Supabase yet (no
// 'the-reset' module) — the dashboard renders an honest coming-soon state
// in that case rather than fabricating lessons.
export async function getResetModule(): Promise<ResetModuleData | null> {
  if (!SUPABASE_CONFIGURED) return null
  try {
    const supabase = await getSupabase()
    const { data: moduleRow, error: moduleError } = await supabase
      .from('modules')
      .select('id, title, description')
      .eq('slug', 'the-reset')
      .eq('status', 'published')
      .maybeSingle()
    if (moduleError || !moduleRow) {
      if (moduleError) console.error('getResetModule failed:', moduleError.message)
      return null
    }

    // 'scheduled' lessons are included alongside 'published' ones so the
    // course can show a locked, countdown-timed preview ahead of its
    // release_date — same pattern as the Free Videos list.
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('id, title, description, thumbnail_url, duration, category, analyst_name, mux_playback_id, processing_status, sort_order, status, release_date')
      .eq('module_id', moduleRow.id)
      .in('status', ['published', 'scheduled'])
      .eq('processing_status', 'ready')
      .order('sort_order', { ascending: true })
    if (videosError) console.error('getResetModule videos failed:', videosError.message)

    const now = Date.now()
    const lessons = (videos ?? []).map(row => mapResetLesson(row, now))
    const launchAt = lessons
      .filter(l => l.isLocked && l.releaseDate)
      .map(l => l.releaseDate as string)
      .sort()[0] ?? null

    return {
      id: moduleRow.id,
      title: moduleRow.title,
      description: moduleRow.description ?? '',
      lessons,
      launchAt,
    }
  } catch (e) { console.error('getResetModule failed:', e); return null }
}

export async function getResetProgress(userId: string, moduleId: string): Promise<{
  percentage: number
  completedVideoIds: string[]
}> {
  const fallback = { percentage: 0, completedVideoIds: [] }
  if (!SUPABASE_CONFIGURED || !userId) return fallback
  try {
    const supabase = await getSupabase()
    const [{ data: moduleProgress }, { data: videoProgress }] = await Promise.all([
      supabase.from('user_module_progress').select('progress_percentage').eq('user_id', userId).eq('module_id', moduleId).maybeSingle(),
      supabase.from('video_progress').select('video_id').eq('user_id', userId).eq('completed', true),
    ])
    return {
      percentage: moduleProgress?.progress_percentage ?? 0,
      completedVideoIds: (videoProgress ?? []).map((v: { video_id: string }) => v.video_id),
    }
  } catch (e) { console.error('getResetProgress failed:', e); return fallback }
}

// Self-reported completion toggle for a Reset lesson — not watch-time tracked.
// Recomputes and upserts the rollup module percentage after each change.
// No forced sequencing: any lesson can be marked complete in any order.
export async function setResetLessonComplete(
  userId: string,
  videoId: string,
  moduleId: string,
  lessonIds: string[],
  completed: boolean,
): Promise<{ success: boolean; percentage: number }> {
  const fallback = { success: false, percentage: 0 }
  if (!SUPABASE_CONFIGURED || !userId) return fallback
  try {
    const supabase = await getSupabase()
    const { error: upsertError } = await supabase.from('video_progress').upsert(
      { user_id: userId, video_id: videoId, completed, completed_at: completed ? new Date().toISOString() : null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,video_id' },
    )
    if (upsertError) throw upsertError

    const { data: completedRows } = await supabase
      .from('video_progress')
      .select('video_id')
      .eq('user_id', userId)
      .eq('completed', true)
      .in('video_id', lessonIds)

    const completedCount = completedRows?.length ?? 0
    const percentage = lessonIds.length > 0 ? Math.round((completedCount / lessonIds.length) * 100) : 0

    const { error: moduleError } = await supabase.from('user_module_progress').upsert(
      {
        user_id: userId, module_id: moduleId, progress_percentage: percentage,
        completed: percentage === 100,
        completed_at: percentage === 100 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,module_id' },
    )
    if (moduleError) throw moduleError

    return { success: true, percentage }
  } catch (e) { console.error('setResetLessonComplete failed:', e); return fallback }
}

export async function getContentCounts(): Promise<{
  freeVideos: number
  goldModules: number
  liveSessions: number
  marketBreakdowns: number
}> {
  const fallback = {
    freeVideos: mockFreeVideos.length,
    goldModules: mockModules.length,
    liveSessions: mockLiveSessions.length,
    marketBreakdowns: mockMarketBreakdowns.length,
  }
  if (!SUPABASE_CONFIGURED) return fallback
  try {
    const supabase = await getSupabase()
    const [freeVideosRes, goldModulesRes, liveSessionsRes, marketBreakdownsRes] = await Promise.all([
      supabase.from('videos').select('id', { count: 'exact', head: true }).eq('access_level', 'free').eq('status', 'published'),
      supabase.from('modules').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('live_sessions').select('id', { count: 'exact', head: true }).in('status', ['upcoming', 'live']),
      supabase.from('videos').select('id', { count: 'exact', head: true }).eq('category', 'Market Breakdown').eq('status', 'published'),
    ])
    return {
      freeVideos: freeVideosRes.count ?? fallback.freeVideos,
      goldModules: goldModulesRes.count ?? fallback.goldModules,
      liveSessions: liveSessionsRes.count ?? fallback.liveSessions,
      marketBreakdowns: marketBreakdownsRes.count ?? fallback.marketBreakdowns,
    }
  } catch { return fallback }
}

export async function getStrategyVault() {
  return mockStrategyVault
}

export async function getRevisionMaterials() {
  return mockRevisionMaterials
}

export async function saveEmailPreferences(userId: string, prefs: {
  email_consent: boolean
  marketing_opt_in: boolean
}): Promise<{ success: boolean; error?: string }> {
  if (!SUPABASE_CONFIGURED) return { success: true }
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.from('profiles').update(prefs).eq('id', userId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function saveProfileName(userId: string, full_name: string): Promise<{ success: boolean; error?: string }> {
  if (!SUPABASE_CONFIGURED) return { success: true }
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.from('profiles').update({ full_name }).eq('id', userId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
