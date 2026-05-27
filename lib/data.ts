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
    thumbnail: row.thumbnail_url ?? null,
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
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    date: row.published_at ?? row.created_at,
    type: 'platform',
    isNew: true,
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

export async function getFreeVideos(): Promise<Video[]> {
  if (!SUPABASE_CONFIGURED) return mockFreeVideos
  try {
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('access_level', 'free')
      .eq('status', 'published')
      .order('release_date', { ascending: false })
    return data?.length ? data.map(mapVideo) : mockFreeVideos
  } catch { return mockFreeVideos }
}

export async function getAllVideos(): Promise<Video[]> {
  if (!SUPABASE_CONFIGURED) return [...mockFreeVideos, ...mockMarketBreakdowns]
  try {
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('status', 'published')
      .order('release_date', { ascending: false })
    return data?.length ? data.map(mapVideo) : [...mockFreeVideos, ...mockMarketBreakdowns]
  } catch { return [...mockFreeVideos, ...mockMarketBreakdowns] }
}

export async function getMarketBreakdowns(): Promise<Video[]> {
  if (!SUPABASE_CONFIGURED) return mockMarketBreakdowns
  try {
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('category', 'Market Breakdown')
      .eq('status', 'published')
      .order('release_date', { ascending: false })
    return data?.length ? data.map(mapVideo) : mockMarketBreakdowns
  } catch { return mockMarketBreakdowns }
}

export async function getAnnouncements(): Promise<Announcement[]> {
  if (!SUPABASE_CONFIGURED) return mockAnnouncements
  try {
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false })
    return data?.length ? data.map(mapAnnouncement) : mockAnnouncements
  } catch { return mockAnnouncements }
}

export async function getLiveSessions(): Promise<LiveSession[]> {
  if (!SUPABASE_CONFIGURED) return mockLiveSessions
  try {
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('live_sessions')
      .select('*')
      .order('session_time', { ascending: true })
    return data?.length ? data.map(mapLiveSession) : mockLiveSessions
  } catch { return mockLiveSessions }
}

export async function getModules(): Promise<Module[]> {
  if (!SUPABASE_CONFIGURED) return mockModules
  try {
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('modules')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
    return data?.length ? data.map(mapModule) : mockModules
  } catch { return mockModules }
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
}) {
  if (!SUPABASE_CONFIGURED) return
  try {
    const supabase = await getSupabase()
    await supabase.from('profiles').update(prefs).eq('id', userId)
  } catch { /* silent */ }
}

export async function saveProfileName(userId: string, full_name: string) {
  if (!SUPABASE_CONFIGURED) return
  try {
    const supabase = await getSupabase()
    await supabase.from('profiles').update({ full_name }).eq('id', userId)
  } catch { /* silent */ }
}
