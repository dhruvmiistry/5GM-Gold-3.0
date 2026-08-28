-- ─────────────────────────────────────────────────────────────────────────
-- Mentor-Call Booking — Part 4: atomic operations
-- Run after 009_notification_outbox.sql
--
-- Every mutation that touches credits and/or bookings is a single
-- SECURITY DEFINER function so it's transactionally atomic — no
-- multi-step client code that could partially apply. These are called
-- exclusively via the service-role client from trusted Next.js API
-- routes (never directly by anon/authenticated) — see the REVOKE/GRANT
-- block at the end of this file.
--
-- Custom error codes used throughout (caught and translated to friendly
-- messages by the calling API routes):
--   P0001 insufficient_credits        P0006 booking_not_reschedulable
--   P0002 upcoming_booking_limit      P0007 reason_required
--   P0003 booking_not_found           P0008 profile_not_found
--   P0004 booking_not_assignable      P0009 mentor_has_future_bookings
--   P0005 mentor_not_active
-- ─────────────────────────────────────────────────────────────────────────

-- ── Internal helper: apply one ledger entry + keep the balance in sync ───
-- Idempotent by construction via the partial unique indexes on
-- credit_ledger — a conflicting retry silently applies nothing and
-- returns NULL rather than raising.
CREATE OR REPLACE FUNCTION public._apply_credit_ledger_entry(
  p_user_id uuid,
  p_delta integer,
  p_reason text,
  p_booking_id uuid DEFAULT NULL,
  p_gold_enrollment_id uuid DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ledger_id uuid;
BEGIN
  INSERT INTO credit_balances (user_id, balance) VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  -- Row lock serializes every concurrent grant/spend/refund for this user.
  PERFORM 1 FROM credit_balances WHERE user_id = p_user_id FOR UPDATE;

  INSERT INTO credit_ledger (user_id, delta, reason, booking_id, gold_enrollment_id, actor_id, note, idempotency_key)
  VALUES (p_user_id, p_delta, p_reason, p_booking_id, p_gold_enrollment_id, p_actor_id, p_note, p_idempotency_key)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_ledger_id;

  IF v_ledger_id IS NOT NULL THEN
    UPDATE credit_balances SET balance = balance + p_delta, updated_at = now() WHERE user_id = p_user_id;
  END IF;

  RETURN v_ledger_id;
END;
$$;

-- ── One-time free credit grant ────────────────────────────────────────
-- Idempotent: a second call for the same user is a silent no-op (see
-- uq_credit_ledger_free_grant). Safe to call from a bulk backfill loop.
CREATE OR REPLACE FUNCTION public.grant_free_credits(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._apply_credit_ledger_entry(
    p_user_id, 2, 'free_grant', NULL, NULL, NULL, 'One-time free member call credits'
  );
END;
$$;

-- ── Gold enrollment (Replace policy) ──────────────────────────────────
-- Zeroes any unused free balance via an explicit entitlement_replacement
-- entry, then grants a fresh 12. Multiple enrollment rows over time are
-- allowed (deliberate re-enrollment) — each is its own audited event and
-- its own idempotent 12-credit grant (keyed to that enrollment's id, not
-- the user), so a later cancellation refund on an old booking can never
-- reactivate a replacement from a previous enrollment.
CREATE OR REPLACE FUNCTION public.enroll_gold(p_user_id uuid, p_actor_id uuid, p_note text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_enrollment_id uuid;
  v_current_balance integer;
BEGIN
  INSERT INTO gold_enrollments (user_id, enrolled_by, note)
  VALUES (p_user_id, p_actor_id, p_note)
  RETURNING id INTO v_enrollment_id;

  INSERT INTO credit_balances (user_id, balance) VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO v_current_balance FROM credit_balances WHERE user_id = p_user_id FOR UPDATE;

  IF v_current_balance > 0 THEN
    PERFORM public._apply_credit_ledger_entry(
      p_user_id, -v_current_balance, 'entitlement_replacement', NULL, v_enrollment_id, p_actor_id,
      'Unused free credits replaced by Gold enrollment'
    );
  END IF;

  PERFORM public._apply_credit_ledger_entry(
    p_user_id, 12, 'gold_grant', NULL, v_enrollment_id, p_actor_id, 'Gold programme enrollment'
  );

  RETURN v_enrollment_id;
END;
$$;

-- ── Admin credit adjustment — reason required ─────────────────────────
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(p_user_id uuid, p_delta integer, p_actor_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = 'P0007';
  END IF;

  INSERT INTO credit_balances (user_id, balance) VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  PERFORM 1 FROM credit_balances WHERE user_id = p_user_id FOR UPDATE;

  IF p_delta < 0 AND NOT EXISTS (
    SELECT 1 FROM credit_balances WHERE user_id = p_user_id AND balance + p_delta >= 0
  ) THEN
    RAISE EXCEPTION 'insufficient_credits' USING ERRCODE = 'P0001';
  END IF;

  PERFORM public._apply_credit_ledger_entry(p_user_id, p_delta, 'admin_adjustment', NULL, NULL, p_actor_id, p_reason);

  INSERT INTO staff_audit_log (actor_id, action, target_type, target_id, reason, metadata)
  VALUES (p_actor_id, 'admin_adjust_credits', 'profile', p_user_id, p_reason, jsonb_build_object('delta', p_delta));
END;
$$;

-- ── Create booking ─────────────────────────────────────────────────────
-- No mentor picked here — mentor_id stays NULL until assign_mentor().
-- The no_member_overlap EXCLUDE constraint gives the final race-proof
-- guarantee against double-booking the same member; a genuine collision
-- surfaces to the caller as a 23P01 exclusion_violation.
-- Also enqueues the member's own confirmation + reminder jobs — these
-- don't need to wait for a mentor to exist.
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

  INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
  VALUES (v_booking_id, 'confirmation', 'member', p_member_id, now(), v_booking_id || ':confirmation:member:1')
  ON CONFLICT DO NOTHING;

  INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
  SELECT v_booking_id, t.type, 'member', p_member_id, p_start_at - t.lead, v_booking_id || ':' || t.type || ':member:1'
  FROM (VALUES ('reminder_24h', interval '24 hours'), ('reminder_1h', interval '1 hour')) AS t(type, lead)
  WHERE p_start_at - t.lead > now() -- skip thresholds already passed for a late booking
  ON CONFLICT DO NOTHING;

  RETURN v_booking_id;
END;
$$;

-- ── Assign mentor ──────────────────────────────────────────────────────
-- Real availability validation is the caller's job (checking this
-- mentor's weekly template/overrides before calling); this function's
-- UPDATE is the final, database-enforced guarantee via no_mentor_overlap.
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
  VALUES (p_booking_id, 'mentor_assigned', 'mentor', p_mentor_id, now(), p_booking_id || ':mentor_assigned:mentor:1')
  ON CONFLICT DO NOTHING;

  INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
  SELECT p_booking_id, t.type, 'mentor', p_mentor_id, v_booking.start_at - t.lead, p_booking_id || ':' || t.type || ':mentor:1'
  FROM (VALUES ('reminder_24h', interval '24 hours'), ('reminder_1h', interval '1 hour')) AS t(type, lead)
  WHERE v_booking.start_at - t.lead > now() -- skip thresholds already passed for a late assignment
  ON CONFLICT DO NOTHING;
END;
$$;

-- ── Cancel booking ─────────────────────────────────────────────────────
-- Idempotent: cancelling an already-non-'confirmed' booking is a silent
-- no-op, so a retried request can't double-refund. cancel_kind drives
-- refund eligibility (member cancels are subject to the 12h cutoff;
-- mentor/admin-initiated cancellations always refund).
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id uuid, p_actor_id uuid, p_cancel_kind text, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_booking mentor_bookings%ROWTYPE;
  v_hours_notice numeric;
  v_refund boolean;
BEGIN
  SELECT * INTO v_booking FROM mentor_bookings WHERE id = p_booking_id FOR UPDATE;
  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'booking_not_found' USING ERRCODE = 'P0003';
  END IF;
  IF v_booking.status != 'confirmed' THEN
    RETURN;
  END IF;

  v_hours_notice := EXTRACT(EPOCH FROM (v_booking.start_at - now())) / 3600.0;
  v_refund := (p_cancel_kind IN ('mentor_admin', 'no_mentor_available'))
    OR (p_cancel_kind = 'member' AND v_hours_notice >= 12);

  UPDATE mentor_bookings SET
    status = 'cancelled', cancelled_at = now(), cancelled_by = p_actor_id,
    cancel_kind = p_cancel_kind, cancel_reason = p_reason
  WHERE id = p_booking_id;

  IF v_refund THEN
    PERFORM public._apply_credit_ledger_entry(
      v_booking.member_id, 1, 'booking_refund', p_booking_id, NULL, p_actor_id, 'Cancellation refund'
    );
  END IF;

  UPDATE notification_jobs SET status = 'skipped' WHERE booking_id = p_booking_id AND status = 'pending';

  INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
  VALUES (p_booking_id, 'cancellation', 'member', v_booking.member_id, now(), p_booking_id || ':cancellation:member:1')
  ON CONFLICT DO NOTHING;

  IF v_booking.mentor_id IS NOT NULL THEN
    INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
    VALUES (p_booking_id, 'cancellation', 'mentor', v_booking.mentor_id, now(), p_booking_id || ':cancellation:mentor:1')
    ON CONFLICT DO NOTHING;
  END IF;

  IF p_actor_id != v_booking.member_id THEN
    INSERT INTO staff_audit_log (actor_id, action, target_type, target_id, reason, metadata)
    VALUES (p_actor_id, 'cancel_booking', 'mentor_booking', p_booking_id, p_reason,
      jsonb_build_object('cancel_kind', p_cancel_kind, 'refunded', v_refund));
  END IF;
END;
$$;

-- ── Reschedule booking ─────────────────────────────────────────────────
-- Creates a new row (preserves history via rescheduled_from_id) and
-- cancels the old one with cancel_kind='rescheduled' (never refund-
-- eligible — the credit carries over via credit_ledger_spend_id, no
-- extra charge). If the new row violates an overlap constraint the whole
-- function aborts and the original booking is left completely untouched.
CREATE OR REPLACE FUNCTION public.reschedule_booking(p_booking_id uuid, p_new_start_at timestamptz, p_actor_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old mentor_bookings%ROWTYPE;
  v_new_id uuid;
  v_new_end timestamptz;
BEGIN
  SELECT * INTO v_old FROM mentor_bookings WHERE id = p_booking_id FOR UPDATE;
  IF v_old.id IS NULL THEN
    RAISE EXCEPTION 'booking_not_found' USING ERRCODE = 'P0003';
  END IF;
  IF v_old.status != 'confirmed' THEN
    RAISE EXCEPTION 'booking_not_reschedulable' USING ERRCODE = 'P0006';
  END IF;

  v_new_end := p_new_start_at + (v_old.duration_minutes || ' minutes')::interval;

  INSERT INTO mentor_bookings (
    member_id, mentor_id, status, start_at, end_at, duration_minutes, buffer_minutes,
    trading_experience, main_challenge, discuss_topic, rescheduled_from_id, credit_ledger_spend_id
  ) VALUES (
    v_old.member_id, v_old.mentor_id, 'confirmed', p_new_start_at, v_new_end, v_old.duration_minutes, v_old.buffer_minutes,
    v_old.trading_experience, v_old.main_challenge, v_old.discuss_topic, v_old.id, v_old.credit_ledger_spend_id
  ) RETURNING id INTO v_new_id;

  UPDATE mentor_bookings SET
    status = 'cancelled', cancelled_at = now(), cancelled_by = p_actor_id,
    cancel_kind = 'rescheduled', cancel_reason = 'Rescheduled to ' || p_new_start_at
  WHERE id = p_booking_id;

  UPDATE notification_jobs SET status = 'skipped' WHERE booking_id = p_booking_id AND status = 'pending';

  INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
  VALUES (v_new_id, 'reschedule', 'member', v_old.member_id, now(), v_new_id || ':reschedule:member:1')
  ON CONFLICT DO NOTHING;
  INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
  SELECT v_new_id, t.type, 'member', v_old.member_id, p_new_start_at - t.lead, v_new_id || ':' || t.type || ':member:1'
  FROM (VALUES ('reminder_24h', interval '24 hours'), ('reminder_1h', interval '1 hour')) AS t(type, lead)
  WHERE p_new_start_at - t.lead > now()
  ON CONFLICT DO NOTHING;

  IF v_old.mentor_id IS NOT NULL THEN
    INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
    VALUES (v_new_id, 'reschedule', 'mentor', v_old.mentor_id, now(), v_new_id || ':reschedule:mentor:1')
    ON CONFLICT DO NOTHING;
    INSERT INTO notification_jobs (booking_id, type, recipient_role, recipient_id, scheduled_for, idempotency_key)
    SELECT v_new_id, t.type, 'mentor', v_old.mentor_id, p_new_start_at - t.lead, v_new_id || ':' || t.type || ':mentor:1'
    FROM (VALUES ('reminder_24h', interval '24 hours'), ('reminder_1h', interval '1 hour')) AS t(type, lead)
    WHERE p_new_start_at - t.lead > now()
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO staff_audit_log (actor_id, action, target_type, target_id, metadata)
  VALUES (p_actor_id, 'reschedule_booking', 'mentor_booking', p_booking_id,
    jsonb_build_object('new_booking_id', v_new_id, 'new_start_at', p_new_start_at));

  RETURN v_new_id;
END;
$$;

-- ── Mark no-show / completed ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mark_no_show(p_booking_id uuid, p_actor_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status FROM mentor_bookings WHERE id = p_booking_id FOR UPDATE;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'booking_not_found' USING ERRCODE = 'P0003';
  END IF;
  IF v_status != 'confirmed' THEN
    RETURN;
  END IF;

  UPDATE mentor_bookings SET status = 'no_show', no_show_marked_by = p_actor_id, no_show_marked_at = now()
  WHERE id = p_booking_id;
  -- No refund — no-show consumes the credit, per policy.

  UPDATE notification_jobs SET status = 'skipped' WHERE booking_id = p_booking_id AND status = 'pending';

  INSERT INTO staff_audit_log (actor_id, action, target_type, target_id)
  VALUES (p_actor_id, 'mark_no_show', 'mentor_booking', p_booking_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_completed(p_booking_id uuid, p_actor_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status FROM mentor_bookings WHERE id = p_booking_id FOR UPDATE;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'booking_not_found' USING ERRCODE = 'P0003';
  END IF;
  IF v_status != 'confirmed' THEN
    RETURN;
  END IF;

  UPDATE mentor_bookings SET status = 'completed' WHERE id = p_booking_id;

  INSERT INTO staff_audit_log (actor_id, action, target_type, target_id)
  VALUES (p_actor_id, 'mark_completed', 'mentor_booking', p_booking_id);
END;
$$;

-- ── Assign / remove the mentor role ───────────────────────────────────
-- Single atomic action: promotes the account (unless already admin, who
-- keep role='admin' and simply also become bookable) and creates/updates
-- their mentor_profiles row.
CREATE OR REPLACE FUNCTION public.assign_as_mentor(
  p_profile_id uuid, p_actor_id uuid, p_display_name text, p_bio text DEFAULT NULL,
  p_image_url text DEFAULT NULL, p_specialty text[] DEFAULT '{}', p_timezone text DEFAULT 'Europe/London'
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM 1 FROM profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found' USING ERRCODE = 'P0008';
  END IF;

  UPDATE profiles SET role = 'mentor' WHERE id = p_profile_id AND role = 'member';

  INSERT INTO mentor_profiles (profile_id, display_name, bio, image_url, specialty, timezone)
  VALUES (p_profile_id, p_display_name, p_bio, p_image_url, p_specialty, p_timezone)
  ON CONFLICT (profile_id) DO UPDATE SET
    display_name = EXCLUDED.display_name, bio = EXCLUDED.bio, image_url = EXCLUDED.image_url,
    specialty = EXCLUDED.specialty, timezone = EXCLUDED.timezone, active = true;

  INSERT INTO staff_audit_log (actor_id, action, target_type, target_id)
  VALUES (p_actor_id, 'assign_mentor_role', 'profile', p_profile_id);
END;
$$;

-- Refuses if the mentor still has future confirmed bookings — admin must
-- reassign or cancel those first, so a live appointment never silently
-- loses its owner.
CREATE OR REPLACE FUNCTION public.remove_mentor(p_profile_id uuid, p_actor_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_future_count integer;
BEGIN
  SELECT count(*) INTO v_future_count FROM mentor_bookings
    WHERE mentor_id = p_profile_id AND status = 'confirmed' AND start_at > now();
  IF v_future_count > 0 THEN
    RAISE EXCEPTION 'mentor_has_future_bookings' USING ERRCODE = 'P0009';
  END IF;

  UPDATE mentor_profiles SET active = false WHERE profile_id = p_profile_id;
  UPDATE profiles SET role = 'member' WHERE id = p_profile_id AND role = 'mentor';

  INSERT INTO staff_audit_log (actor_id, action, target_type, target_id)
  VALUES (p_actor_id, 'remove_mentor_role', 'profile', p_profile_id);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- EXECUTE PERMISSIONS — service role only
-- SECURITY DEFINER makes these run with elevated privilege; without this
-- explicit lockdown, Postgres grants EXECUTE to PUBLIC by default, which
-- would let any authenticated/anon caller invoke them directly. They are
-- meant to be called only from trusted API routes via the service-role
-- client, which independently verifies the caller's real identity first.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      '_apply_credit_ledger_entry', 'grant_free_credits', 'enroll_gold', 'admin_adjust_credits',
      'create_booking', 'assign_mentor', 'cancel_booking', 'reschedule_booking',
      'mark_no_show', 'mark_completed', 'assign_as_mentor', 'remove_mentor'
    )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;
END $$;
