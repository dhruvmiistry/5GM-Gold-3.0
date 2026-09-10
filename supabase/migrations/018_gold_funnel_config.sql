-- ─────────────────────────────────────────────────────────────────────────
-- Gold Desk Funnel — Part 2: funnel config + RLS-level applications gate
-- Run after 017_gold_applications.sql
--
-- Deliberately NOT another row in platform_settings: that table's RLS lets
-- ANY authenticated member SELECT every row (see 001_initial_schema.sql),
-- which would let a member read call_booking_url directly via the Supabase
-- REST API before they're ever invited to a call. gold_funnel_config has no
-- open-read policy at all — only is_admin() can read or write it. Member-
-- facing marketing copy is served through a narrow server-side endpoint
-- (/api/gold/funnel-copy) that whitelists the safe subset instead.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gold_funnel_config (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  value      jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.gold_funnel_config (key, value) VALUES
  ('funnel_state',              '"hidden"'),   -- hidden | teaser | applications_open | applications_closed | week_one_active | full_programme
  ('headline',                  '"5GM Gold Starts Here."'),
  ('subheadline',                '"Trade alongside the 5GM team. Learn the complete model. Twelve weeks of structured development."'),
  ('offer_headline',            '"Week 1 Free"'),
  ('scarcity_copy',             '"Only 25 places available"'),
  ('cta_label',                 '"Apply For Week 1"'),
  ('week1_start_date',          'null'),
  ('application_deadline',      'null'),
  ('vsl_mux_playback_id',       '"2KmH6DEd00ShAzsnmZheCJ9RPEK9Sr7vy8uSS00tqHIQM"'),
  ('vsl_poster_url',            'null'),
  ('call_booking_url',          'null'),
  ('confirmation_headline',     '"Application Received"'),
  ('confirmation_body',         '"Thanks for applying for Week 1 of 5GM Gold. Our team will review your application and, if successful, contact you with the next step."')
ON CONFLICT (key) DO NOTHING;

DROP TRIGGER IF EXISTS set_updated_at ON public.gold_funnel_config;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.gold_funnel_config
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.gold_funnel_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage funnel config"
  ON public.gold_funnel_config FOR ALL
  USING (public.is_admin());
-- No SELECT policy for ordinary authenticated users — intentional.

-- ── RLS-level applications-open gate ──────────────────────────────────────
-- SECURITY DEFINER lets this read gold_funnel_config despite the calling
-- member having no SELECT grant on it themselves — same shape as
-- is_mentor_calls_enabled() in migration 016.
CREATE OR REPLACE FUNCTION public.is_gold_applications_open()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT value = '"applications_open"'::jsonb FROM public.gold_funnel_config WHERE key = 'funnel_state'),
    false
  );
$$;

DROP POLICY IF EXISTS "Applicants create own application" ON public.gold_applications;
CREATE POLICY "Applicants create own application"
  ON public.gold_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_gold_applications_open());
