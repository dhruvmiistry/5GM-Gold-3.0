-- ─────────────────────────────────────────────────────────────────────────
-- Gold Desk Funnel — Part 4: lightweight funnel analytics
-- Run after 019_gold_notification_jobs.sql
--
-- Deliberately minimal — insert-only event log, no aggregation tables. The
-- admin funnel view computes counts with a GROUP BY at read time; at this
-- feature's expected volume that's simpler and cheaper to keep correct than
-- a maintained rollup.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gold_funnel_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     text NOT NULL CHECK (event_type IN (
                    'vsl_viewed', 'vsl_play_clicked', 'vsl_completed',
                    'apply_cta_clicked', 'application_started',
                    'phone_verification_requested', 'phone_verified',
                    'application_submitted'
                  )),
  user_id        uuid REFERENCES public.profiles ON DELETE SET NULL,
  application_id uuid REFERENCES public.gold_applications ON DELETE SET NULL,
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gold_funnel_events_type_created
  ON public.gold_funnel_events (event_type, created_at DESC);

ALTER TABLE public.gold_funnel_events ENABLE ROW LEVEL SECURITY;

-- Any authenticated member can log their own events (or an anonymous-at-the-
-- time event with user_id left null, e.g. a VSL view before login) — this
-- table holds no sensitive content, only event names/timestamps/ids.
CREATE POLICY "Users insert own funnel events"
  ON public.gold_funnel_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "Admins read funnel events"
  ON public.gold_funnel_events FOR SELECT
  USING (public.is_admin());
