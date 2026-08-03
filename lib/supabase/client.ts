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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // /auth/callback deliberately exchanges the PKCE code itself (client-side,
          // on mount — see that page's comment on email Safe Links scanners). The
          // SDK's default auto-detection races that same code: if it wins, it silently
          // consumes the single-use code and establishes a session before the callback
          // page's own exchange runs, which then finds no code, bounces to /login, and
          // — since the user is already authenticated from the auto-detected session —
          // gets immediately redirected to /dashboard, skipping whatever `next` page
          // was actually requested (e.g. /reset-password never gets shown, silently
          // signing the user in instead of letting them set a new password).
          detectSessionInUrl: false,
        },
      }
    )
  }
  return client
}
