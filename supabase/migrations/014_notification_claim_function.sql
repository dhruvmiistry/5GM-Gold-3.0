-- ─────────────────────────────────────────────────────────────────────────
-- Mentor-Call Booking — Part 8: notification claim function
-- Run after 013_skip_reminders_on_completion.sql
--
-- FOR UPDATE SKIP LOCKED isn't expressible through PostgREST's normal
-- select/update calls, so claiming due jobs needs a dedicated function —
-- this is what makes concurrent cron-run overlaps safe (two invocations
-- racing never claim the same row).
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.claim_notification_jobs(p_limit integer DEFAULT 20)
RETURNS SETOF public.notification_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  UPDATE notification_jobs
  SET status = 'processing', attempts = attempts + 1
  WHERE id IN (
    SELECT id FROM notification_jobs
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
    WHERE n.nspname = 'public' AND p.proname = 'claim_notification_jobs'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;
END $$;
