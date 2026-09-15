// The small set of team members who actually run Gold Desk Week 1 calls and
// sign the "Invited To Call" email under their own first name. Deliberately
// a hand-picked list, not every admin and not mentor_profiles (that table
// belongs to the separate, unrelated paid-programme credit-booking system).
// Update this array directly if the roster changes — three people, rare
// enough that a code change + redeploy is simpler than building admin UI
// for it.
export type CallHost = {
  profileId: string
  shortName: string
}

export const CALL_HOSTS: CallHost[] = [
  { profileId: '9815ff37-1609-468e-9be6-bf536957b67d', shortName: 'Bani' },   // Taha R - TradeBani
  { profileId: 'f299e331-cb75-4e70-b431-dfd152a3d1cf', shortName: 'AB' },     // Albin R - ABTrading
  { profileId: '47937491-5b48-40b9-8fb5-a394c965a78f', shortName: 'Mubz' },   // Zakir M - TradeMubz
]

export function getCallHost(profileId: string | null | undefined): CallHost | null {
  if (!profileId) return null
  return CALL_HOSTS.find(h => h.profileId === profileId) ?? null
}
