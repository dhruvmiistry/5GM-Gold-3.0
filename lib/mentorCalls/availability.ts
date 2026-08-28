import { fromZonedTime } from 'date-fns-tz'
import type { SupabaseClient } from '@supabase/supabase-js'

// Availability is computed from a mentor's weekly template + per-date
// overrides, always resolved through their IANA timezone (mentor_profiles
// .timezone) rather than a fixed UTC offset — this is what keeps DST
// transitions correct instead of silently drifting an hour twice a year.

export interface UtcRange {
  start: Date
  end: Date
}

interface WeeklyAvailabilityRow {
  day_of_week: number
  start_time: string // 'HH:mm:ss'
  end_time: string
}

interface OverrideRow {
  kind: 'unavailable' | 'custom_hours'
  start_time: string | null
  end_time: string | null
}

// Converts a calendar date + local wall-clock time (both interpreted in
// `timezone`) into the correct UTC instant, DST-safe by construction.
function localToUtc(date: string, time: string, timezone: string): Date {
  const hhmm = time.length >= 5 ? time.slice(0, 5) : time
  return fromZonedTime(`${date}T${hhmm}:00`, timezone)
}

// Returns the mentor's effective bookable windows (as UTC ranges) for one
// calendar date — weekly template, overridden by that date's row if one
// exists ('unavailable' clears the day entirely; 'custom_hours' replaces it).
export async function getMentorWindowsForDate(
  supabase: SupabaseClient,
  mentorId: string,
  date: string, // 'YYYY-MM-DD', interpreted in the mentor's own timezone
  timezone: string,
): Promise<UtcRange[]> {
  const { data: override } = await supabase
    .from('mentor_availability_overrides')
    .select('kind, start_time, end_time')
    .eq('mentor_id', mentorId)
    .eq('date', date)
    .maybeSingle<OverrideRow>()

  if (override?.kind === 'unavailable') return []

  if (override?.kind === 'custom_hours' && override.start_time && override.end_time) {
    return [{ start: localToUtc(date, override.start_time, timezone), end: localToUtc(date, override.end_time, timezone) }]
  }

  // date.getDay() on a plain 'YYYY-MM-DD' is evaluated in UTC by the Date
  // constructor, which — for a calendar date with no time component — is
  // exactly the calendar day-of-week we want, independent of any timezone.
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay()

  const { data: windows } = await supabase
    .from('mentor_weekly_availability')
    .select('day_of_week, start_time, end_time')
    .eq('mentor_id', mentorId)
    .eq('day_of_week', dayOfWeek)
    .returns<WeeklyAvailabilityRow[]>()

  return (windows ?? []).map(w => ({
    start: localToUtc(date, w.start_time, timezone),
    end: localToUtc(date, w.end_time, timezone),
  }))
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd
}

// Real, per-mentor check used at assignment time — a friendly pre-check
// before the database's EXCLUDE constraint has the final say. Confirms the
// requested slot falls inside an availability window AND doesn't collide
// (with buffer) with that mentor's other confirmed bookings.
export async function isMentorFreeAt(
  supabase: SupabaseClient,
  mentorId: string,
  startAt: Date,
  endAt: Date,
  bufferMinutes: number,
): Promise<boolean> {
  const { data: mentor } = await supabase
    .from('mentor_profiles')
    .select('timezone, active, min_notice_hours, max_horizon_days')
    .eq('profile_id', mentorId)
    .maybeSingle()
  if (!mentor?.active) return false

  const date = startAt.toISOString().slice(0, 10)
  const windows = await getMentorWindowsForDate(supabase, mentorId, date, mentor.timezone)
  const withinWindow = windows.some(w => startAt >= w.start && endAt <= w.end)
  if (!withinWindow) return false

  const bufferMs = bufferMinutes * 60_000
  const { data: existing } = await supabase
    .from('mentor_bookings')
    .select('start_at, end_at')
    .eq('mentor_id', mentorId)
    .eq('status', 'confirmed')
    .returns<{ start_at: string; end_at: string }[]>()

  const conflict = (existing ?? []).some(b =>
    rangesOverlap(
      new Date(new Date(b.start_at).getTime() - bufferMs),
      new Date(new Date(b.end_at).getTime() + bufferMs),
      startAt, endAt,
    )
  )
  return !conflict
}

// Display-only heuristic for the member-facing slot picker (Phase B): is
// there at least one active mentor whose weekly template covers this slot?
// This deliberately does NOT check existing bookings (no mentor is chosen
// yet, so there's nothing to conflict with) — it only keeps members from
// requesting a time nobody ever works. The real guarantee is isMentorFreeAt()
// at assignment time plus the database EXCLUDE constraints.
function mergeRanges(ranges: UtcRange[]): UtcRange[] {
  if (ranges.length === 0) return []
  const sorted = [...ranges].sort((a, b) => a.start.getTime() - b.start.getTime())
  const merged: UtcRange[] = [{ ...sorted[0] }]
  for (const r of sorted.slice(1)) {
    const last = merged[merged.length - 1]
    if (r.start <= last.end) {
      if (r.end > last.end) last.end = r.end
    } else {
      merged.push({ ...r })
    }
  }
  return merged
}

// Powers the member-facing slot picker (Phase B): every bookable start
// time on a given calendar date, at `granularityMinutes` increments,
// where the union of all active mentors' windows covers a full
// `durationMinutes` block. Same display-heuristic nature as
// hasAnyMentorTemplateCoverage — doesn't check existing bookings, since
// no mentor is chosen yet.
export async function getAggregateSlotsForDate(
  supabase: SupabaseClient,
  date: string,
  durationMinutes: number,
  granularityMinutes = 30,
): Promise<Date[]> {
  const { data: mentors } = await supabase
    .from('mentor_profiles')
    .select('profile_id, timezone')
    .eq('active', true)
    .returns<{ profile_id: string; timezone: string }[]>()

  const allWindows: UtcRange[] = []
  for (const mentor of mentors ?? []) {
    const windows = await getMentorWindowsForDate(supabase, mentor.profile_id, date, mentor.timezone)
    allWindows.push(...windows)
  }
  if (allWindows.length === 0) return []

  const merged = mergeRanges(allWindows)
  const stepMs = granularityMinutes * 60_000
  const durMs = durationMinutes * 60_000
  const slots: Date[] = []
  for (const range of merged) {
    for (let t = range.start.getTime(); t + durMs <= range.end.getTime(); t += stepMs) {
      slots.push(new Date(t))
    }
  }
  return slots
}

export async function hasAnyMentorTemplateCoverage(
  supabase: SupabaseClient,
  startAt: Date,
  endAt: Date,
): Promise<boolean> {
  const { data: mentors } = await supabase
    .from('mentor_profiles')
    .select('profile_id, timezone')
    .eq('active', true)
    .returns<{ profile_id: string; timezone: string }[]>()

  for (const mentor of mentors ?? []) {
    const date = startAt.toISOString().slice(0, 10)
    const windows = await getMentorWindowsForDate(supabase, mentor.profile_id, date, mentor.timezone)
    if (windows.some(w => startAt >= w.start && endAt <= w.end)) return true
  }
  return false
}
