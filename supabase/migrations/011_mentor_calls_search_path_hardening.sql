-- ─────────────────────────────────────────────────────────────────────────
-- Mentor-Call Booking — Part 5: search_path hardening
-- Run after 010_mentor_calls_functions.sql
--
-- Supabase's security advisor flagged is_mentor() and
-- shift_timestamptz_minutes() for a mutable search_path (same pre-existing
-- gap as is_admin()/is_gold(), left untouched — they're relied on by RLS
-- policies exactly as they are, and fixing them isn't part of this
-- feature). Purely additive hardening, no behavior change.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_mentor()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'mentor'
  );
$$;

CREATE OR REPLACE FUNCTION public.shift_timestamptz_minutes(ts timestamptz, minutes integer)
RETURNS timestamptz LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT ts + (minutes * interval '1 minute');
$$;
