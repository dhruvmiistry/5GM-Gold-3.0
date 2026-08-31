-- ─────────────────────────────────────────────────────────────────────────
-- Mentor-Call Booking — Part 9: release-control feature flag
-- Run after 014_notification_claim_function.sql
--
-- Seeds mentor_calls_enabled = false. No existing platform_settings row is
-- touched or overwritten (ON CONFLICT DO NOTHING) — this key doesn't exist
-- yet, confirmed before writing this migration.
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO public.platform_settings (key, value)
VALUES ('mentor_calls_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
