-- ─────────────────────────────────────────────────────────────────────────
-- Mentor-Call Booking — Part 1: role model
-- Run after 006_video_sort_order.sql
--
-- Adds 'mentor' as a third profiles.role value, additive to the existing
-- CHECK constraint (all current rows are 'member'/'admin', unaffected).
-- A mentor is NOT automatically gold — is_gold() is untouched, staff roles
-- don't imply member entitlements, same principle as admins not getting
-- gold content merely from admin access.
-- ─────────────────────────────────────────────────────────────────────────

-- Widen the CHECK constraint. Looked up dynamically rather than assuming
-- the auto-generated name (profiles_role_check), in case it differs on the
-- live database.
DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'profiles'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%role%member%admin%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cname);
  END IF;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('member', 'admin', 'mentor'));
END $$;

-- ── Helper: is the calling user an active mentor? ─────────────────────────
-- Mirrors is_admin()/is_gold()'s exact shape for consistency.
CREATE OR REPLACE FUNCTION public.is_mentor()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'mentor'
  );
$$;
