-- ─────────────────────────────────────────────────────────────────────────
-- 5GM Gold — Migration 003: Enforce free plan defaults for new signups
-- ─────────────────────────────────────────────────────────────────────────

-- ── 1. Harden the new-user trigger to be explicit ────────────────────────
-- Previously relied on column defaults; now sets plan/role/access_level
-- explicitly so no edge case (e.g. default override, future schema change)
-- can accidentally grant gold or admin access.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    trading_experience,
    signup_source,
    role,
    plan,
    access_level
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'trading_experience',
    NEW.raw_user_meta_data->>'signup_source',
    'member',
    'free',
    'free'
  );
  RETURN NEW;
END;
$$;

-- ── 2. Fix any existing non-admin profiles that ended up on gold ──────────
-- Safety net: resets any profile that is not explicitly an admin back to free.
-- Remove this block if you have legitimate gold members already.

UPDATE public.profiles
SET
  plan         = 'free',
  access_level = 'free'
WHERE
  role != 'admin'
  AND plan = 'gold';
