-- ─────────────────────────────────────────────────────────────────────────
-- Mentor-Call Booking — Part 6: confirmation-on-assignment
-- Run after 011_mentor_calls_search_path_hardening.sql
--
-- Business-rule correction: the member's real "you're confirmed" email
-- fires once admin assigns a mentor (that IS the confirmation moment),
-- not at initial request. At request time the member now gets a light
-- "request received" acknowledgment instead. No rows exist yet in
-- notification_jobs, so this is a clean redefinition, not a data migration.
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'notification_jobs'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%type%confirmation%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.notification_jobs DROP CONSTRAINT %I', cname);
  END IF;

  ALTER TABLE public.notification_jobs
    ADD CONSTRAINT notification_jobs_type_check CHECK (type IN (
      'request_received', 'mentor_assigned', 'booking_confirmed', 'meeting_details',
      'cancellation', 'reschedule', 'reminder_24h', 'reminder_1h'
    ));
END $$;

-- create_booking(): member gets a light acknowledgment, not the real
-- confirmation, at submission time. Same signature — CREATE OR REPLACE
-- preserves the existing service_role-only execute grant.
CREATE OR REPLACE FUNCTION public.create_booking(
  p_member_id uuid,
  p_start_at timestamptz,
  p_duration_minutes integer,
  p_trading_experience text DEFAULT NULL,
  p_main_challenge text DEFAULT NULL,
  p_discuss_topic text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_booking_id uuid;
  v_balance integer;
  v_upcoming_count integer;
  v_ledger_id uuid;
  v_end_at timestamptz := p_start_at + (p_duration_minutes || ' minutes')::interval;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT booking_id INTO v_booking_id FROM credit_ledger
      WHERE idempotency_key = p_idempotency_key AND reason = 'booking_spend';
    IF v_booking_id IS NOT NULL THEN
      RETURN v_booking_id;
    END IF;
  END IF;

  INSERT INTO credit_balances (user_id, balance) VALUES (p_member_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO v_balance FROM credit_balances WHERE user_id = p_member_id FOR UPDATE;

  IF v_balance < 1 THEN
    RAISE EXCEPTION 'insufficient_credits' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_upcoming_count FROM mentor_bookings
    WHERE member_id = p_member_id AND status = 'confirmed' AND start_at > now();
  IF v_upcoming_count >= 1 THEN
    RAISE EXCEPTION 'upcoming_booking_limit_reached' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO mentor_bookings (member_id, start_at, end_at, duration_minutes, trading_experience, main_challenge, discuss_topic)
  VALUES (p_member_id, p_start_at, v_end_at, p_duration_minutes, p_trading_experience, p_main_challenge, p_discuss_topic)
  RETURNING id INTO v_booking_id;

  v_ledger_id := public._apply_credit_ledger_entry(
    p_member_id, -1, 'booking_spend', v_booking_id, NULL, p_member_id, 'Call booked', p_idempotency_key
  );
  UPDATE mentor_bookings SET credit_ledger_spend_id = v_ledger_id WHERE id = v_booking_id;

  -- Light acknowledgment only — the real "confirmed" email waits for
  -- assign_mentor() below, which is the actual confirmation moment.
  INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
  VALUES (v_booking_id, 'request_received', 'member', p_member_id, now(), v_booking_id || ':request_received:member:1')
  ON CONFLICT DO NOTHING;

  INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
  SELECT v_booking_id, t.type, 'member', p_member_id, p_start_at - t.lead, v_booking_id || ':' || t.type || ':member:1'
  FROM (VALUES ('reminder_24h', interval '24 hours'), ('reminder_1h', interval '1 hour')) AS t(type, lead)
  WHERE p_start_at - t.lead > now()
  ON CONFLICT DO NOTHING;

  RETURN v_booking_id;
END;
$$;

-- assign_mentor(): this IS the confirmation moment — sends the real
-- "you're confirmed" email to the member, alongside the existing
-- mentor-facing notification.
CREATE OR REPLACE FUNCTION public.assign_mentor(p_booking_id uuid, p_mentor_id uuid, p_actor_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_buffer integer;
  v_booking mentor_bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM mentor_bookings WHERE id = p_booking_id FOR UPDATE;
  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'booking_not_found' USING ERRCODE = 'P0003';
  END IF;
  IF v_booking.status != 'confirmed' THEN
    RAISE EXCEPTION 'booking_not_assignable' USING ERRCODE = 'P0004';
  END IF;

  SELECT buffer_minutes INTO v_buffer FROM mentor_profiles WHERE profile_id = p_mentor_id AND active;
  IF v_buffer IS NULL THEN
    RAISE EXCEPTION 'mentor_not_active' USING ERRCODE = 'P0005';
  END IF;

  UPDATE mentor_bookings SET mentor_id = p_mentor_id, buffer_minutes = v_buffer WHERE id = p_booking_id;

  INSERT INTO staff_audit_log (actor_id, action, target_type, target_id, metadata)
  VALUES (p_actor_id, 'assign_mentor', 'mentor_booking', p_booking_id, jsonb_build_object('mentor_id', p_mentor_id));

  INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
  VALUES (p_booking_id, 'booking_confirmed', 'member', v_booking.member_id, now(), p_booking_id || ':booking_confirmed:member:1')
  ON CONFLICT DO NOTHING;

  INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
  VALUES (p_booking_id, 'mentor_assigned', 'mentor', p_mentor_id, now(), p_booking_id || ':mentor_assigned:mentor:1')
  ON CONFLICT DO NOTHING;

  INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
  SELECT p_booking_id, t.type, 'mentor', p_mentor_id, v_booking.start_at - t.lead, p_booking_id || ':' || t.type || ':mentor:1'
  FROM (VALUES ('reminder_24h', interval '24 hours'), ('reminder_1h', interval '1 hour')) AS t(type, lead)
  WHERE v_booking.start_at - t.lead > now()
  ON CONFLICT DO NOTHING;
END;
$$;
