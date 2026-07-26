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
