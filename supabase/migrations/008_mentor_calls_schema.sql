-- ─────────────────────────────────────────────────────────────────────────
-- Mentor-Call Booking — Part 2: schema
-- Run after 007_mentor_role.sql
--
-- Members request a date/time only (no mentor picker) — admin assigns a
-- mentor afterward. mentor_bookings.mentor_id is NULL until assigned; the
-- DB-enforced overlap-prevention constraints only bite once it's set.
-- ─────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ── MENTOR PROFILES ────────────────────────────────────────────────────
-- 1:1 extension of an existing profiles row (role='mentor' set alongside
-- this row's creation — see the admin "Assign as Mentor" action).
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  profile_id            uuid PRIMARY KEY REFERENCES public.profiles ON DELETE CASCADE,
  display_name          text NOT NULL,
  bio                   text,
  image_url             text,
  specialty             text[] NOT NULL DEFAULT '{}',
  timezone              text NOT NULL DEFAULT 'Europe/London',
  active                boolean NOT NULL DEFAULT true,
  call_duration_minutes integer NOT NULL DEFAULT 30 CHECK (call_duration_minutes > 0),
  buffer_minutes        integer NOT NULL DEFAULT 15 CHECK (buffer_minutes >= 0),
  min_notice_hours      integer NOT NULL DEFAULT 24 CHECK (min_notice_hours >= 0),
  max_horizon_days      integer NOT NULL DEFAULT 30 CHECK (max_horizon_days > 0),
  sort_order            integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ── MENTOR WEEKLY AVAILABILITY ─────────────────────────────────────────
-- Recurring template, interpreted in mentor_profiles.timezone (never a
-- fixed UTC offset — DST-safe by construction).
CREATE TABLE IF NOT EXISTS public.mentor_weekly_availability (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id   uuid NOT NULL REFERENCES public.mentor_profiles ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

-- ── MENTOR AVAILABILITY OVERRIDES ──────────────────────────────────────
-- Per-date time off or one-off custom hours, overriding the weekly template.
CREATE TABLE IF NOT EXISTS public.mentor_availability_overrides (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id   uuid NOT NULL REFERENCES public.mentor_profiles ON DELETE CASCADE,
  date        date NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('unavailable', 'custom_hours')),
  start_time  time,
  end_time    time,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentor_id, date),
  CHECK (kind = 'unavailable' OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time))
);

-- ── GOLD ENROLLMENTS ───────────────────────────────────────────────────
-- The explicit, audited enrollment event. A bare profiles.plan toggle
-- cannot create one of these — only this insert triggers the 12-credit
-- replacement grant. Multiple rows over time are allowed (deliberate
-- re-enrollment after a later downgrade); each one is its own audited event.
CREATE TABLE IF NOT EXISTS public.gold_enrollments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  enrolled_by uuid NOT NULL REFERENCES public.profiles,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  note        text
);

-- ── MENTOR BOOKINGS ────────────────────────────────────────────────────
-- credit_ledger_spend_id has no FK yet (credit_ledger references this
-- table) — added below once both tables exist, avoiding a create-order
-- deadlock between the two circularly-referencing tables.
--
-- buffer_minutes is snapshotted from mentor_profiles at assignment time
-- (not looked up live) because the overlap-prevention EXCLUDE constraint
-- below can only reference columns on this same row, not another table.
CREATE TABLE IF NOT EXISTS public.mentor_bookings (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id              uuid NOT NULL REFERENCES public.profiles,
  mentor_id              uuid REFERENCES public.profiles, -- NULL until admin assigns
  status                 text NOT NULL DEFAULT 'confirmed'
                           CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  start_at               timestamptz NOT NULL, -- always UTC
  end_at                 timestamptz NOT NULL,
  duration_minutes       integer NOT NULL CHECK (duration_minutes > 0),
  buffer_minutes         integer NOT NULL DEFAULT 15 CHECK (buffer_minutes >= 0),
  trading_experience     text,
  main_challenge         text,
  discuss_topic          text,
  cancelled_at           timestamptz,
  cancelled_by           uuid REFERENCES public.profiles,
  cancel_kind            text CHECK (cancel_kind IN ('member', 'mentor_admin', 'rescheduled', 'no_mentor_available')),
  cancel_reason          text,
  no_show_marked_by      uuid REFERENCES public.profiles,
  no_show_marked_at      timestamptz,
  rescheduled_from_id    uuid REFERENCES public.mentor_bookings,
  credit_ledger_spend_id uuid,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

-- ── CREDIT LEDGER ──────────────────────────────────────────────────────
-- Server-authoritative, auditable. Partial unique indexes below give
-- idempotency: retried grant/spend/refund requests become no-ops rather
-- than double-applying.
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  delta              integer NOT NULL,
  reason             text NOT NULL CHECK (reason IN (
                        'free_grant', 'gold_grant', 'entitlement_replacement',
                        'booking_spend', 'booking_refund', 'admin_adjustment'
                      )),
  booking_id         uuid REFERENCES public.mentor_bookings ON DELETE SET NULL,
  gold_enrollment_id uuid REFERENCES public.gold_enrollments ON DELETE SET NULL,
  actor_id           uuid REFERENCES public.profiles,
  note               text,
  idempotency_key    text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (reason != 'admin_adjustment' OR note IS NOT NULL)
);

ALTER TABLE public.mentor_bookings
  ADD CONSTRAINT mentor_bookings_credit_ledger_spend_fk
  FOREIGN KEY (credit_ledger_spend_id) REFERENCES public.credit_ledger ON DELETE SET NULL;

-- ── CREDIT BALANCES (cached, kept transactionally consistent) ─────────
CREATE TABLE IF NOT EXISTS public.credit_balances (
  user_id    uuid PRIMARY KEY REFERENCES public.profiles ON DELETE CASCADE,
  balance    integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── MEETING DETAILS ────────────────────────────────────────────────────
-- Separate table so RLS can restrict it independently of the booking row,
-- and so "email only on material change" is a simple hash comparison.
CREATE TABLE IF NOT EXISTS public.mentor_booking_meeting_details (
  booking_id         uuid PRIMARY KEY REFERENCES public.mentor_bookings ON DELETE CASCADE,
  meeting_url        text,
  meeting_id         text,
  passcode           text,
  updated_by         uuid REFERENCES public.profiles,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  last_notified_hash text
);

-- ── BOOKING MESSAGES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mentor_booking_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.mentor_bookings ON DELETE CASCADE,
  sender_id  uuid NOT NULL REFERENCES public.profiles,
  body       text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Per-user "last read" marker per booking thread — simplest workable
-- unread signal, no per-message read flags needed for v1.
CREATE TABLE IF NOT EXISTS public.mentor_booking_message_reads (
  booking_id    uuid NOT NULL REFERENCES public.mentor_bookings ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  last_read_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (booking_id, user_id)
);

-- ── STAFF NOTES ────────────────────────────────────────────────────────
-- Private to admin + the currently-assigned mentor. Never surfaced in any
-- member-facing query, the message thread, or an email.
CREATE TABLE IF NOT EXISTS public.mentor_booking_staff_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.mentor_bookings ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES public.profiles,
  body       text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── STAFF AUDIT LOG (generic, not booking-specific) ────────────────────
-- Covers mentor assignment/removal, credit adjustments, booking
-- reassignment/staff-cancellation, gold enrollment — every "audit the
-- change" requirement in the brief routes through this one table.
CREATE TABLE IF NOT EXISTS public.staff_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid NOT NULL REFERENCES public.profiles,
  action      text NOT NULL,
  target_type text NOT NULL,
  target_id   uuid,
  reason      text,
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- CONFLICT PREVENTION — enforced at the database layer, not just the UI
-- ─────────────────────────────────────────────────────────────────────────

-- Postgres marks the timestamptz +/- interval operators STABLE (not
-- IMMUTABLE) across the board, because an interval CAN carry a month/year
-- component whose length depends on the session timezone/calendar. A
-- GiST exclusion constraint's indexed expression must be IMMUTABLE though.
-- A minutes-only interval has no such ambiguity — it's a fixed physical
-- duration — so this thin wrapper is genuinely deterministic, and IMMUTABLE
-- is a correct (if unverified-by-Postgres) promise here.
CREATE OR REPLACE FUNCTION public.shift_timestamptz_minutes(ts timestamptz, minutes integer)
RETURNS timestamptz LANGUAGE sql IMMUTABLE AS $$
  SELECT ts + (minutes * interval '1 minute');
$$;

-- A mentor cannot have two overlapping confirmed bookings (buffer included).
-- Only applies once mentor_id is set — unassigned requests don't participate.
ALTER TABLE public.mentor_bookings ADD CONSTRAINT no_mentor_overlap
  EXCLUDE USING gist (
    mentor_id WITH =,
    tstzrange(
      public.shift_timestamptz_minutes(start_at, -buffer_minutes),
      public.shift_timestamptz_minutes(end_at, buffer_minutes),
      '[]'
    ) WITH &&
  ) WHERE (status = 'confirmed' AND mentor_id IS NOT NULL);

-- A member cannot hold two overlapping confirmed bookings, regardless of
-- which mentor ends up assigned to either one.
ALTER TABLE public.mentor_bookings ADD CONSTRAINT no_member_overlap
  EXCLUDE USING gist (
    member_id WITH =,
    tstzrange(start_at, end_at, '[]') WITH &&
  ) WHERE (status = 'confirmed');

-- ─────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mentor_weekly_avail_mentor   ON public.mentor_weekly_availability (mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_overrides_mentor_date ON public.mentor_availability_overrides (mentor_id, date);
CREATE INDEX IF NOT EXISTS idx_gold_enrollments_user        ON public.gold_enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_member       ON public.mentor_bookings (member_id);
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_mentor       ON public.mentor_bookings (mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_status_start ON public.mentor_bookings (status, start_at);
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_needs_mentor ON public.mentor_bookings (start_at)
  WHERE (status = 'confirmed' AND mentor_id IS NULL);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user           ON public.credit_ledger (user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_booking        ON public.credit_ledger (booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_ledger_free_grant
  ON public.credit_ledger (user_id) WHERE (reason = 'free_grant');
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_ledger_gold_grant
  ON public.credit_ledger (gold_enrollment_id) WHERE (reason = 'gold_grant');
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_ledger_booking_spend
  ON public.credit_ledger (booking_id) WHERE (reason = 'booking_spend');
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_ledger_booking_refund
  ON public.credit_ledger (booking_id) WHERE (reason = 'booking_refund');
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_ledger_idempotency
  ON public.credit_ledger (idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_booking_messages_booking     ON public.mentor_booking_messages (booking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_staff_notes_booking          ON public.mentor_booking_staff_notes (booking_id);
CREATE INDEX IF NOT EXISTS idx_staff_audit_log_actor        ON public.staff_audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_audit_log_target        ON public.staff_audit_log (target_type, target_id);

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at triggers (extends the existing pattern to the new tables)
-- ─────────────────────────────────────────────────────────────────────────
DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['mentor_profiles', 'mentor_bookings']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
       CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();', t, t);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.mentor_profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_weekly_availability      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_availability_overrides   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gold_enrollments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_bookings                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_balances                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_booking_meeting_details   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_booking_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_booking_message_reads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_booking_staff_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_audit_log                  ENABLE ROW LEVEL SECURITY;

-- ── MENTOR PROFILES policies ───────────────────────────────────────────
-- Active mentors are readable by any authenticated member (for e.g. an
-- admin-facing mentor picker) — bios/images are not sensitive.
CREATE POLICY "Active mentors readable by authenticated users"
  ON public.mentor_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND (active OR public.is_admin()));

CREATE POLICY "Mentors read own profile"
  ON public.mentor_profiles FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Mentors update own availability settings"
  ON public.mentor_profiles FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins manage mentor profiles"
  ON public.mentor_profiles FOR ALL
  USING (public.is_admin());

-- ── AVAILABILITY policies ──────────────────────────────────────────────
CREATE POLICY "Authenticated users read weekly availability"
  ON public.mentor_weekly_availability FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Mentors manage own weekly availability"
  ON public.mentor_weekly_availability FOR ALL
  USING (auth.uid() = mentor_id OR public.is_admin());

CREATE POLICY "Authenticated users read availability overrides"
  ON public.mentor_availability_overrides FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Mentors manage own availability overrides"
  ON public.mentor_availability_overrides FOR ALL
  USING (auth.uid() = mentor_id OR public.is_admin());

-- ── GOLD ENROLLMENTS policies ──────────────────────────────────────────
CREATE POLICY "Users read own enrollment history"
  ON public.gold_enrollments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins manage gold enrollments"
  ON public.gold_enrollments FOR ALL
  USING (public.is_admin());

-- ── MENTOR BOOKINGS policies ───────────────────────────────────────────
CREATE POLICY "Members read own bookings"
  ON public.mentor_bookings FOR SELECT
  USING (auth.uid() = member_id);

CREATE POLICY "Assigned mentors read their bookings"
  ON public.mentor_bookings FOR SELECT
  USING (auth.uid() = mentor_id);

CREATE POLICY "Admins manage all bookings"
  ON public.mentor_bookings FOR ALL
  USING (public.is_admin());

-- Direct member/mentor writes to this table are not exposed — all
-- mutations go through the SECURITY DEFINER RPC functions (Part 3
-- migration) called from server-side API routes using the service role,
-- so booking creation/cancellation/reassignment stay atomic and the
-- overlap-prevention constraints above are always the final authority.

-- ── CREDIT LEDGER / BALANCES policies ──────────────────────────────────
CREATE POLICY "Users read own credit ledger"
  ON public.credit_ledger FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins manage credit ledger"
  ON public.credit_ledger FOR ALL
  USING (public.is_admin());

CREATE POLICY "Users read own credit balance"
  ON public.credit_balances FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins manage credit balances"
  ON public.credit_balances FOR ALL
  USING (public.is_admin());

-- ── MEETING DETAILS policies ───────────────────────────────────────────
CREATE POLICY "Booking participants read meeting details"
  ON public.mentor_booking_meeting_details FOR SELECT
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.mentor_bookings b
      WHERE b.id = booking_id AND (b.member_id = auth.uid() OR b.mentor_id = auth.uid())
    )
  );

CREATE POLICY "Assigned mentors manage meeting details"
  ON public.mentor_booking_meeting_details FOR ALL
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.mentor_bookings b
      WHERE b.id = booking_id AND b.mentor_id = auth.uid()
    )
  );

-- ── BOOKING MESSAGES policies ──────────────────────────────────────────
CREATE POLICY "Booking participants read messages"
  ON public.mentor_booking_messages FOR SELECT
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.mentor_bookings b
      WHERE b.id = booking_id AND (b.member_id = auth.uid() OR b.mentor_id = auth.uid())
    )
  );

CREATE POLICY "Booking participants send messages"
  ON public.mentor_booking_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND (
      public.is_admin() OR EXISTS (
        SELECT 1 FROM public.mentor_bookings b
        WHERE b.id = booking_id AND (b.member_id = auth.uid() OR b.mentor_id = auth.uid())
      )
    )
  );

CREATE POLICY "Booking participants manage own read markers"
  ON public.mentor_booking_message_reads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── STAFF NOTES policies ───────────────────────────────────────────────
-- Admin + the CURRENTLY assigned mentor only. Never the member.
CREATE POLICY "Admin and assigned mentor read staff notes"
  ON public.mentor_booking_staff_notes FOR SELECT
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.mentor_bookings b
      WHERE b.id = booking_id AND b.mentor_id = auth.uid()
    )
  );

CREATE POLICY "Admin and assigned mentor write staff notes"
  ON public.mentor_booking_staff_notes FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND (
      public.is_admin() OR EXISTS (
        SELECT 1 FROM public.mentor_bookings b
        WHERE b.id = booking_id AND b.mentor_id = auth.uid()
      )
    )
  );

-- ── STAFF AUDIT LOG policies ───────────────────────────────────────────
CREATE POLICY "Admins read audit log"
  ON public.staff_audit_log FOR SELECT
  USING (public.is_admin());

-- Writes happen only via the SECURITY DEFINER functions (service role);
-- no direct client INSERT policy is granted.
