-- ─────────────────────────────────────────────────────────────────────────
-- Gold Desk Funnel — Part 3: application notification outbox
-- Run after 018_gold_funnel_config.sql
--
-- Same durable-job-queue shape as notification_jobs (009) / claim_notification_jobs
-- (014), sized down for this feature: the applicant is always the sole
-- recipient, so there's no recipient_role/recipient_id split to make — the
-- processor looks up the application's user_id fresh at send time instead.
-- A separate table (not a generalized notification_jobs) because that
-- table's booking_id FK and recipient_role CHECK are mentor-calls-specific;
-- forcing this feature through it would mean loosening constraints that are
-- there on purpose for that feature.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gold_application_notification_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES public.gold_applications ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('received', 'invited_to_call', 'accepted_week_one', 'rejected')),
  scheduled_for   timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts        integer NOT NULL DEFAULT 0,
  last_error      text,
  -- Convention: `${application_id}:${type}` — the UNIQUE constraint makes a
  -- repeated admin action (e.g. clicking "Invite To Call" twice) a no-op
  -- enqueue rather than a duplicate email, without needing extra guard logic
  -- in the calling route.
  idempotency_key text NOT NULL UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  sent_at         timestamptz
);

CREATE INDEX IF NOT EXISTS idx_gold_notification_jobs_claim
  ON public.gold_application_notification_jobs (scheduled_for)
  WHERE (status = 'pending');
CREATE INDEX IF NOT EXISTS idx_gold_notification_jobs_application
  ON public.gold_application_notification_jobs (application_id);
CREATE INDEX IF NOT EXISTS idx_gold_notification_jobs_failed
  ON public.gold_application_notification_jobs (created_at DESC)
  WHERE (status = 'failed');

ALTER TABLE public.gold_application_notification_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read gold notification jobs"
  ON public.gold_application_notification_jobs FOR SELECT
  USING (public.is_admin());
-- All writes (enqueue, claim, mark sent/failed) happen via the service role
-- from the admin action route and the cron processor — no client
-- INSERT/UPDATE policy is granted.

CREATE OR REPLACE FUNCTION public.claim_gold_notification_jobs(p_limit integer DEFAULT 20)
RETURNS SETOF public.gold_application_notification_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  UPDATE gold_application_notification_jobs
  SET status = 'processing', attempts = attempts + 1
  WHERE id IN (
    SELECT id FROM gold_application_notification_jobs
    WHERE status = 'pending' AND scheduled_for <= now()
    ORDER BY scheduled_for
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'claim_gold_notification_jobs'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;
END $$;
