import { isMentorCallsEnabled } from '@/lib/mentorCalls/featureFlag'
import { NextResponse } from 'next/server'

// Lightweight read-only capability check for client UI (e.g. the sidebar
// nav item). No auth requirement — this reveals nothing about any member's
// data, just whether the feature is currently switched on at all, which is
// not sensitive.
export async function GET() {
  return NextResponse.json({ enabled: await isMentorCallsEnabled() })
}
