-- ─────────────────────────────────────────────────────────────────────────
-- Mentor-Call Booking — Part 7: skip stale reminders on completion
-- Run after 012_confirmation_on_assignment.sql
--
-- Bug found via manual testing: mark_completed() left pending
-- reminder_24h/reminder_1h jobs in place, which — once Phase C's sender
-- exists — would send "your call is in 24 hours" for a call already
-- marked done. cancel_booking()/mark_no_show() already skip ALL pending
-- jobs (correct there — nothing about a cancelled/no-show booking should
-- still notify). Completion is different: a still-pending confirmation-
-- type notice is still an accurate historical fact if sent late, so only
-- the two reminder types are skipped here, not everything pending.
-- ─────────────────────────────────────────────────────────────────────────

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

  UPDATE notification_jobs SET status = 'skipped'
  WHERE booking_id = p_booking_id AND status = 'pending' AND type IN ('reminder_24h', 'reminder_1h');

  INSERT INTO staff_audit_log (actor_id, action, target_type, target_id)
  VALUES (p_actor_id, 'mark_completed', 'mentor_booking', p_booking_id);
END;
$$;
