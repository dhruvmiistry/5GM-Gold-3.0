import { redirect } from 'next/navigation'
import { isMentorCallsEnabled } from '@/lib/mentorCalls/featureFlag'
import MentorCallsClient from './MentorCallsClient'

// Server component gate — the flag is checked before any HTML is sent, so
// there's no client-side flash of booking UI while settings load (unlike
// the useEffect-based role checks elsewhere in this app). Redirects
// everyone, including admins, to the ordinary dashboard: admin preparation
// for mentor calls happens in the admin area, not by previewing this
// member-facing page.
export default async function MentorCallsPage() {
  if (!(await isMentorCallsEnabled())) {
    redirect('/dashboard')
  }
  return <MentorCallsClient />
}
