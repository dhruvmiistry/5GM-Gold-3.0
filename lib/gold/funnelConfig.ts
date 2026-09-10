import { createAdminClient } from '@/lib/supabase/admin'

// gold_funnel_config has no open-read RLS policy (unlike platform_settings) —
// only is_admin() can SELECT it at the database layer. Every read here goes
// through the service-role client deliberately, and MEMBER_SAFE_KEYS is the
// only thing standing between this data and a member-facing response.
// call_booking_url must never be added to that list.
const MEMBER_SAFE_KEYS = [
  'funnel_state', 'headline', 'subheadline', 'offer_headline', 'scarcity_copy',
  'cta_label', 'week1_start_date', 'application_deadline', 'vsl_mux_playback_id',
  'vsl_poster_url', 'confirmation_headline', 'confirmation_body',
] as const

export type GoldFunnelState =
  | 'hidden' | 'teaser' | 'applications_open' | 'applications_closed'

function rowsToObject(rows: { key: string; value: unknown }[]) {
  return Object.fromEntries(rows.map(r => [r.key, r.value])) as Record<string, unknown>
}

// Safe to expose to any authenticated member via an API route.
export async function getMemberSafeFunnelConfig() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('gold_funnel_config')
    .select('key, value')
    .in('key', MEMBER_SAFE_KEYS as unknown as string[])
  if (error || !data) return null
  return rowsToObject(data)
}

// Admin-only — includes call_booking_url and every other key.
export async function getFullFunnelConfig() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('gold_funnel_config').select('key, value')
  if (error || !data) return {}
  return rowsToObject(data)
}

export async function getFunnelState(): Promise<GoldFunnelState> {
  const admin = createAdminClient()
  const { data } = await admin.from('gold_funnel_config').select('value').eq('key', 'funnel_state').maybeSingle()
  return (typeof data?.value === 'string' ? data.value : 'hidden') as GoldFunnelState
}
