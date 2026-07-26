import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendAnnouncementEmails } from '@/lib/email'

export const maxDuration = 60

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

const RECIPIENT_TYPES = new Set(['all', 'free', 'gold', 'admin', 'specific'])

export async function POST(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { subject, title, body, bannerUrl, recipient, targetUserId } = await request.json()

  if (!subject || !title || !body) {
    return NextResponse.json({ error: 'Subject, title, and body are required' }, { status: 400 })
  }
  if (!RECIPIENT_TYPES.has(recipient)) return NextResponse.json({ error: 'Invalid recipient type' }, { status: 400 })
  if (recipient === 'specific' && !targetUserId) {
    return NextResponse.json({ error: 'Select a person to send to' }, { status: 400 })
  }

  const admin = createAdminClient()
  let emails: string[] = []

  if (recipient === 'specific') {
    const { data, error } = await admin.from('profiles').select('email, banned').eq('id', targetUserId).single()
    if (error || !data) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    if (data.banned) return NextResponse.json({ error: 'That user is banned' }, { status: 400 })
    if (!data.email) return NextResponse.json({ error: 'That user has no email on file' }, { status: 400 })
    emails = [data.email]
  } else {
    let query = admin.from('profiles').select('email').eq('banned', false).not('email', 'is', null)
    if (recipient === 'free' || recipient === 'gold') query = query.eq('plan', recipient)
    else if (recipient === 'admin') query = query.eq('role', 'admin')
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    emails = (data ?? []).map(r => r.email).filter(Boolean) as string[]
  }

  if (emails.length === 0) return NextResponse.json({ error: 'No matching recipients found' }, { status: 400 })

  try {
    await sendAnnouncementEmails(emails, subject, title, body, bannerUrl || null)
  } catch (e) {
    console.error('announcements/notify: send failed:', e)
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: `Send failed: ${message}` }, { status: 500 })
  }

  return NextResponse.json({ sent: emails.length })
}
