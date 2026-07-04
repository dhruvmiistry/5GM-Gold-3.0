import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Module-level singleton — every caller across the app (auth-context, lib/data.ts,
// etc.) must share one GoTrueClient. Instantiating a fresh client per call spins up
// independent auth instances that all read/write the same localStorage refresh
// token; when two of them race to refresh at once, the loser's rotated-out token
// gets rejected as invalid, which fires SIGNED_OUT and signs the user out under
// their feet (surfaces as random logouts / login loops mid-session).
let client: SupabaseClient | undefined

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
