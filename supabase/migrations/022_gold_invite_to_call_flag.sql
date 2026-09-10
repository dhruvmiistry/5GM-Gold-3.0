-- ─────────────────────────────────────────────────────────────────────────
-- Gold Desk Funnel — Part 6: explicit lock on Invite To Call
--
-- Same idea as mentor_calls_enabled (015), scoped to gold_funnel_config
-- instead of platform_settings since this is an admin-only workflow gate,
-- not something a member ever reads. Deliberately NOT derived from whether
-- call_booking_url is set — that field gets filled in for testing before
-- the real booking backend exists, and a presence check would silently
-- unlock production behaviour the moment that happens. This flag is a
-- separate, explicit switch the admin flips on the Gold Desk Settings page
-- once the booking backend is actually ready.
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO public.gold_funnel_config (key, value)
VALUES ('invite_to_call_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
