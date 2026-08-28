import type { SupabaseClient } from '@supabase/supabase-js'

export const MESSAGE_MAX_LENGTH = 4000 // matches the DB CHECK constraint — validated here too for a friendlier error
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_MESSAGES = 5 // per sender per booking per window — no existing rate-limit infra in this codebase, so this is a simple DB-count check rather than a new dependency

export async function getBookingMessages(admin: SupabaseClient, bookingId: string) {
  const { data, error } = await admin
    .from('mentor_booking_messages')
    .select('id, sender_id, body, created_at, sender:profiles!mentor_booking_messages_sender_id_fkey(full_name, role)')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })
  return { data, error }
}

export async function sendBookingMessage(admin: SupabaseClient, bookingId: string, senderId: string, body: string) {
  const trimmed = body.trim()
  if (!trimmed) return { data: null, error: { message: 'Message cannot be empty' } }
  if (trimmed.length > MESSAGE_MAX_LENGTH) return { data: null, error: { message: `Message is too long (max ${MESSAGE_MAX_LENGTH} characters)` } }

  const { count } = await admin
    .from('mentor_booking_messages')
    .select('id', { count: 'exact', head: true })
    .eq('booking_id', bookingId)
    .eq('sender_id', senderId)
    .gte('created_at', new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString())
  if ((count ?? 0) >= RATE_LIMIT_MAX_MESSAGES) {
    return { data: null, error: { message: "You're sending messages too quickly — please wait a moment." } }
  }

  return admin.from('mentor_booking_messages').insert({ booking_id: bookingId, sender_id: senderId, body: trimmed }).select().single()
}

// Read BEFORE calling markMessagesRead, so the caller can still tell which
// messages were unread at the moment the thread was opened.
export async function getLastReadAt(admin: SupabaseClient, bookingId: string, userId: string): Promise<string | null> {
  const { data } = await admin.from('mentor_booking_message_reads').select('last_read_at').eq('booking_id', bookingId).eq('user_id', userId).maybeSingle()
  return data?.last_read_at ?? null
}

export async function markMessagesRead(admin: SupabaseClient, bookingId: string, userId: string) {
  return admin.from('mentor_booking_message_reads').upsert(
    { booking_id: bookingId, user_id: userId, last_read_at: new Date().toISOString() },
    { onConflict: 'booking_id,user_id' },
  )
}

export async function getStaffNotes(admin: SupabaseClient, bookingId: string) {
  return admin
    .from('mentor_booking_staff_notes')
    .select('id, author_id, body, created_at, author:profiles!mentor_booking_staff_notes_author_id_fkey(full_name, role)')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })
}

export async function addStaffNote(admin: SupabaseClient, bookingId: string, authorId: string, body: string) {
  const trimmed = body.trim()
  if (!trimmed) return { data: null, error: { message: 'Note cannot be empty' } }
  if (trimmed.length > MESSAGE_MAX_LENGTH) return { data: null, error: { message: `Note is too long (max ${MESSAGE_MAX_LENGTH} characters)` } }
  return admin.from('mentor_booking_staff_notes').insert({ booking_id: bookingId, author_id: authorId, body: trimmed }).select().single()
}
