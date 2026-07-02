import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// London's UTC offset (in minutes) at a given instant — handles BST/GMT automatically.
function londonOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/London', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value)
  const asIfUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return Math.round((asIfUTC - date.getTime()) / 60000)
}

// Converts a `datetime-local` input value (e.g. "2026-07-02T19:00"), interpreted
// as Europe/London wall-clock time, into a correct UTC ISO string for storage.
export function londonTimeToUTCISOString(datetimeLocalValue: string): string {
  const naiveUTC = new Date(`${datetimeLocalValue}:00Z`)
  const offset = londonOffsetMinutes(naiveUTC)
  return new Date(naiveUTC.getTime() - offset * 60000).toISOString()
}

// Converts a stored UTC ISO string back into a `datetime-local` value
// representing the equivalent Europe/London wall-clock time, for editing.
export function utcISOStringToLondonLocal(isoString: string): string {
  const date = new Date(isoString)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}
