-- ─────────────────────────────────────────────────────────────────────────
-- Mentor-Call Booking — Part 10: RLS-level flag enforcement
-- Run after 015_mentor_calls_feature_flag.sql
--
-- Application-layer checks (API routes) are the primary enforcement, but a
-- member could otherwise read their own rows directly via Supabase's REST
-- API using the public anon key + their own session, bypassing every
-- Next.js route entirely. Writes were never at risk this way — every
-- mutation is already locked to service_role-only Postgres functions
-- (migration 010's REVOKE/GRANT block), unreachable by an authenticated
-- user's own session regardless of this flag. This migration closes the
-- read-only gap: member-facing SELECT/INSERT policies now also require
-- the flag, while admin and assigned-mentor access are left untouched
-- (they need to keep preparing the system per the rollout plan).
--
-- Also fixes a latent bug found while auditing this: the message
-- read-marker policy never actually checked booking participancy, only
-- that the caller was writing their own user_id — any authenticated user
-- could upsert a read-marker row for a booking they have no relation to.
-- Doesn't leak message content, but is tightened here regardless.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_mentor_calls_enabled()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT value = 'true'::jsonb FROM public.platform_settings WHERE key = 'mentor_calls_enabled'),
    false
  );
$$;

-- ── mentor_bookings ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Members read own bookings" ON public.mentor_bookings;
CREATE POLICY "Members read own bookings"
  ON public.mentor_bookings FOR SELECT
  USING (auth.uid() = member_id AND public.is_mentor_calls_enabled());
-- "Assigned mentors read their bookings" and "Admins manage all bookings"
-- are untouched — mentors/admins keep access regardless of the flag.

-- ── credit_ledger ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users read own credit ledger" ON public.credit_ledger;
CREATE POLICY "Users read own credit ledger"
  ON public.credit_ledger FOR SELECT
  USING ((auth.uid() = user_id AND public.is_mentor_calls_enabled()) OR public.is_admin());

-- ── credit_balances ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users read own credit balance" ON public.credit_balances;
CREATE POLICY "Users read own credit balance"
  ON public.credit_balances FOR SELECT
  USING ((auth.uid() = user_id AND public.is_mentor_calls_enabled()) OR public.is_admin());

-- ── mentor_booking_meeting_details ─────────────────────────────────────
DROP POLICY IF EXISTS "Booking participants read meeting details" ON public.mentor_booking_meeting_details;
CREATE POLICY "Booking participants read meeting details"
  ON public.mentor_booking_meeting_details FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.mentor_bookings b WHERE b.id = booking_id AND b.mentor_id = auth.uid())
    OR (
      EXISTS (SELECT 1 FROM public.mentor_bookings b WHERE b.id = booking_id AND b.member_id = auth.uid())
      AND public.is_mentor_calls_enabled()
    )
  );
-- "Assigned mentors manage meeting details" (mentor+admin) is untouched.

-- ── mentor_booking_messages ────────────────────────────────────────────
DROP POLICY IF EXISTS "Booking participants read messages" ON public.mentor_booking_messages;
CREATE POLICY "Booking participants read messages"
  ON public.mentor_booking_messages FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.mentor_bookings b WHERE b.id = booking_id AND b.mentor_id = auth.uid())
    OR (
      EXISTS (SELECT 1 FROM public.mentor_bookings b WHERE b.id = booking_id AND b.member_id = auth.uid())
      AND public.is_mentor_calls_enabled()
    )
  );

DROP POLICY IF EXISTS "Booking participants send messages" ON public.mentor_booking_messages;
CREATE POLICY "Booking participants send messages"
  ON public.mentor_booking_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND (
      public.is_admin()
      OR EXISTS (SELECT 1 FROM public.mentor_bookings b WHERE b.id = booking_id AND b.mentor_id = auth.uid())
      OR (
        EXISTS (SELECT 1 FROM public.mentor_bookings b WHERE b.id = booking_id AND b.member_id = auth.uid())
        AND public.is_mentor_calls_enabled()
      )
    )
  );

-- ── mentor_booking_message_reads (bug fix, not flag-related) ───────────
-- Previously only checked "is this my own user_id", not booking
-- participancy at all — tightened to match the messages policies above.
DROP POLICY IF EXISTS "Booking participants manage own read markers" ON public.mentor_booking_message_reads;
CREATE POLICY "Booking participants manage own read markers"
  ON public.mentor_booking_message_reads FOR ALL
  USING (
    auth.uid() = user_id AND (
      public.is_admin()
      OR EXISTS (SELECT 1 FROM public.mentor_bookings b WHERE b.id = booking_id AND b.mentor_id = auth.uid())
      OR (
        EXISTS (SELECT 1 FROM public.mentor_bookings b WHERE b.id = booking_id AND b.member_id = auth.uid())
        AND public.is_mentor_calls_enabled()
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND (
      public.is_admin()
      OR EXISTS (SELECT 1 FROM public.mentor_bookings b WHERE b.id = booking_id AND b.mentor_id = auth.uid())
      OR (
        EXISTS (SELECT 1 FROM public.mentor_bookings b WHERE b.id = booking_id AND b.member_id = auth.uid())
        AND public.is_mentor_calls_enabled()
      )
    )
  );
