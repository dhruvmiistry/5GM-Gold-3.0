// Shared constants for the mentor-call booking flow — kept in one place so
// the slot-display route and the actual booking-creation route can't drift
// out of sync with each other.

// No mentor is chosen at booking time, so there's no per-mentor
// call_duration_minutes/min_notice_hours to read yet — these are
// platform-wide defaults until Phase B+ adds per-mentor variance handling.
export const DEFAULT_CALL_DURATION_MINUTES = 30
export const MIN_NOTICE_HOURS = 24
export const MAX_HORIZON_DAYS = 30
