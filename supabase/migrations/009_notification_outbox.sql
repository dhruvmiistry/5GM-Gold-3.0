-- ─────────────────────────────────────────────────────────────────────────
-- Mentor-Call Booking — Part 3: notification outbox
-- Run after 008_mentor_calls_schema.sql
--
-- Durable job table for booking emails/reminders, processed by a Vercel
-- Cron-triggered route (Phase C) — no in-memory or setTimeout scheduling,
-- survives redeploys/cold starts, safe under concurrent workers via
-- FOR UPDATE SKIP LOCKED claiming.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid NOT NULL REFERENCES public.mentor_bookings ON DELETE CASCADE,
  type             text NOT NULL CHECK (type IN (
                       'confirmation', 'mentor_assigned', 'meeting_details',
                       'cancellation', 'reschedule', 'reminder_24h', 'reminder_1h'
                     )),
  recipient_role   text NOT NULL CHECK (recipient_role IN ('member', 'mentor')),
  recipient_id     uuid NOT NULL REFERENCES public.profiles,
  scheduled_for    timestamptz NOT NULL,
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts         integer NOT NULL DEFAULT 0,
  last_error       text,
  -- Rescheduling creates a brand-new mentor_bookings row (see
  -- reschedule_booking()) rather than mutating start_at in place, so
  -- booking_id itself is the invalidation boundary: old jobs are marked
  -- 'skipped' and fresh jobs are enqueued against the new booking id —
  -- no separate version counter needed for that case.
  idempotency_key  text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  sent_at          timestamptz,
  UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_jobs_claim
  ON public.notification_jobs (scheduled_for)
  WHERE (status = 'pending');
CREATE INDEX IF NOT EXISTS idx_notification_jobs_booking
  ON public.notification_jobs (booking_id);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_failed
  ON public.notification_jobs (created_at DESC)
  WHERE (status = 'failed');

ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read notification jobs"
  ON public.notification_jobs FOR SELECT
  USING (public.is_admin());

-- All writes (enqueue, claim, mark sent/failed) happen via the service
-- role from the booking RPC functions and the cron route — no client
-- INSERT/UPDATE policy is granted.

-- ── POST-VIDEO INVITATION FREQUENCY CAP ────────────────────────────────
-- Server-side "at most one automatic prompt per 24h" — not trusted to
-- client-side state (localStorage doesn't survive a new device/session).
CREATE TABLE IF NOT EXISTS public.post_video_invitation_prompts (
  user_id       uuid PRIMARY KEY REFERENCES public.profiles ON DELETE CASCADE,
  last_shown_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_video_invitation_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own invitation prompt record"
  ON public.post_video_invitation_prompts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
