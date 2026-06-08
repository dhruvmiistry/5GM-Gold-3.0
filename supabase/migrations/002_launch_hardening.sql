-- ─────────────────────────────────────────────────────────────────────────
-- 5GM Gold — Launch Hardening Migration
-- Run after 001_initial_schema.sql
-- ─────────────────────────────────────────────────────────────────────────

-- ── 1. MISSING INDEXES ───────────────────────────────────────────────────

-- profiles: plan filter (admin dashboard + RLS is_gold checks)
CREATE INDEX IF NOT EXISTS idx_profiles_plan     ON public.profiles (plan);
CREATE INDEX IF NOT EXISTS idx_profiles_role     ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_created  ON public.profiles (created_at DESC);

-- profiles: full-text search (admin user search)
-- Requires pg_trgm extension — enable in Supabase dashboard → Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm  ON public.profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm ON public.profiles USING gin (email     gin_trgm_ops);

-- videos: status + access_level (dashboard content queries)
CREATE INDEX IF NOT EXISTS idx_videos_status_access ON public.videos (status, access_level);
CREATE INDEX IF NOT EXISTS idx_videos_module        ON public.videos (module_id);
CREATE INDEX IF NOT EXISTS idx_videos_release_date  ON public.videos (release_date DESC);

-- video_progress: user lookups
CREATE INDEX IF NOT EXISTS idx_video_progress_user  ON public.video_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video ON public.video_progress (video_id);

-- announcements: dashboard query
CREATE INDEX IF NOT EXISTS idx_announcements_status_audience ON public.announcements (status, audience);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at    ON public.announcements (published_at DESC NULLS LAST);

-- live_sessions: upcoming sessions query
CREATE INDEX IF NOT EXISTS idx_live_sessions_status_time ON public.live_sessions (status, session_time);

-- user_module_progress: user lookups
CREATE INDEX IF NOT EXISTS idx_user_mod_progress_user ON public.user_module_progress (user_id);

-- ── 2. LEADS TABLE ───────────────────────────────────────────────────────
-- Captures pre-launch / landing-page email captures before full signup

CREATE TABLE IF NOT EXISTS public.leads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL UNIQUE,
  full_name    text,
  source       text,                        -- e.g. 'landing_page', 'waitlist', 'referral'
  ip_address   text,
  converted_at timestamptz,                 -- set when lead signs up as a user
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_leads_email      ON public.leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_created    ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_converted  ON public.leads (converted_at);

-- Only admins can read/manage leads
CREATE POLICY "Admins manage leads"
  ON public.leads FOR ALL
  USING (public.is_admin());

-- Service role (API routes) can insert
CREATE POLICY "Service role insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- ── 3. SOFT DELETE ON PROFILES ───────────────────────────────────────────
-- Required for GDPR right-to-erasure + audit trail

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_deleted ON public.profiles (deleted_at)
  WHERE deleted_at IS NULL;

-- ── 4. SIGNUP AUDIT LOG ──────────────────────────────────────────────────
-- Records every signup attempt with outcome for monitoring

CREATE TABLE IF NOT EXISTS public.signup_audit (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text,
  ip_address   text,
  user_agent   text,
  outcome      text NOT NULL CHECK (outcome IN ('success', 'duplicate', 'rate_limited', 'error')),
  error_code   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_audit ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_signup_audit_email   ON public.signup_audit (email);
CREATE INDEX IF NOT EXISTS idx_signup_audit_created ON public.signup_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signup_audit_outcome ON public.signup_audit (outcome, created_at DESC);

-- Only admins can read audit log
CREATE POLICY "Admins read signup audit"
  ON public.signup_audit FOR SELECT
  USING (public.is_admin());

-- Service role inserts audit entries
CREATE POLICY "Service role insert signup audit"
  ON public.signup_audit FOR INSERT
  WITH CHECK (true);

-- ── 5. FIX RLS OPERATOR PRECEDENCE BUGS ─────────────────────────────────
-- Three policies have ambiguous OR precedence. Drop and recreate with explicit parens.

-- announcements
DROP POLICY IF EXISTS "Users read relevant announcements" ON public.announcements;
CREATE POLICY "Users read relevant announcements"
  ON public.announcements FOR SELECT
  USING (
    (
      auth.uid() IS NOT NULL AND
      status = 'published' AND (
        audience = 'all' OR
        (audience = 'gold' AND public.is_gold()) OR
        (audience = 'free' AND NOT public.is_gold())
      )
    ) OR public.is_admin()
  );

-- live_sessions
DROP POLICY IF EXISTS "Authenticated users read accessible sessions" ON public.live_sessions;
CREATE POLICY "Authenticated users read accessible sessions"
  ON public.live_sessions FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND (access_level = 'free' OR public.is_gold()))
    OR public.is_admin()
  );

-- resources
DROP POLICY IF EXISTS "Users read accessible resources" ON public.resources;
CREATE POLICY "Users read accessible resources"
  ON public.resources FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND status = 'published' AND (access_level = 'free' OR public.is_gold()))
    OR public.is_admin()
  );

-- ── 6. BLOCK SELF-UPDATE OF SENSITIVE FIELDS ────────────────────────────
-- Drop the existing update policy and tighten it — prevent users from
-- updating admin_notes, signup_source, or email (those belong to admin/auth)

DROP POLICY IF EXISTS "Users can update own limited fields" ON public.profiles;
CREATE POLICY "Users can update own limited fields"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id AND deleted_at IS NULL)
  WITH CHECK (
    auth.uid() = id AND
    role        = (SELECT role        FROM public.profiles WHERE id = auth.uid()) AND
    plan        = (SELECT plan        FROM public.profiles WHERE id = auth.uid()) AND
    access_level = (SELECT access_level FROM public.profiles WHERE id = auth.uid()) AND
    admin_notes  = (SELECT admin_notes  FROM public.profiles WHERE id = auth.uid()) AND
    signup_source = (SELECT signup_source FROM public.profiles WHERE id = auth.uid())
  );

-- ── 7. PLATFORM SETTINGS: add pagination defaults ────────────────────────
INSERT INTO public.platform_settings (key, value) VALUES
  ('admin_page_size',  '50'),
  ('signup_audit_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
