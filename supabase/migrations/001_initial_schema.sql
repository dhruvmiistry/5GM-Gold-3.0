-- ─────────────────────────────────────────────────────────
-- 5GM Gold — Initial Schema
-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────────────────────────

-- ── PROFILES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name         text,
  email             text,
  role              text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  plan              text NOT NULL DEFAULT 'free'   CHECK (plan IN ('free', 'gold')),
  access_level      text NOT NULL DEFAULT 'free'   CHECK (access_level IN ('free', 'gold')),
  avatar_url        text,
  trading_experience text,
  admin_notes       text,
  signup_source     text,
  email_consent     boolean DEFAULT false,
  marketing_opt_in  boolean DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── MODULES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.modules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  thumbnail_url text,
  access_level  text NOT NULL DEFAULT 'gold' CHECK (access_level IN ('free', 'gold')),
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── VIDEOS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.videos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  video_url     text,
  embed_url     text,
  thumbnail_url text,
  duration      text,
  category      text,
  analyst_name  text,
  module_id     uuid REFERENCES public.modules ON DELETE SET NULL,
  access_level  text NOT NULL DEFAULT 'free' CHECK (access_level IN ('free', 'gold')),
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  release_date  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── VIDEO PROGRESS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.video_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  video_id        uuid NOT NULL REFERENCES public.videos ON DELETE CASCADE,
  watched_seconds integer NOT NULL DEFAULT 0,
  completed       boolean NOT NULL DEFAULT false,
  completed_at    timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

-- ── ANNOUNCEMENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  body           text NOT NULL,
  audience       text NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'free', 'gold')),
  pinned         boolean NOT NULL DEFAULT false,
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  scheduled_for  timestamptz,
  published_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── LIVE SESSIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  host_name       text,
  session_time    timestamptz NOT NULL,
  livestream_url  text,
  replay_url      text,
  access_level    text NOT NULL DEFAULT 'gold' CHECK (access_level IN ('free', 'gold')),
  status          text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'replay_available', 'cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── RESOURCES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  file_url      text,
  module_id     uuid REFERENCES public.modules ON DELETE SET NULL,
  access_level  text NOT NULL DEFAULT 'gold' CHECK (access_level IN ('free', 'gold')),
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── USER MODULE PROGRESS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_module_progress (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  module_id           uuid NOT NULL REFERENCES public.modules ON DELETE CASCADE,
  progress_percentage integer NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  completed           boolean NOT NULL DEFAULT false,
  completed_at        timestamptz,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

-- ── PLATFORM SETTINGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  value      jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default platform settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('platform_name',       '"5GM Gold"'),
  ('launch_status',       '"coming_soon"'),
  ('gold_access_status',  '"coming_soon"'),
  ('allow_signups',       'true'),
  ('default_user_plan',   '"free"')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGNUP
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, trading_experience, signup_source)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'trading_experience',
    NEW.raw_user_meta_data->>'signup_source'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── updated_at auto-update ────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','modules','videos','video_progress',
    'announcements','live_sessions','resources','user_module_progress','platform_settings']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
       CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();', t, t);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings     ENABLE ROW LEVEL SECURITY;

-- ── Helper: is the calling user an admin? ─────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── Helper: is the calling user on gold plan? ─────────────
CREATE OR REPLACE FUNCTION public.is_gold()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (plan = 'gold' OR role = 'admin')
  );
$$;

-- ── PROFILES policies ─────────────────────────────────────
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own limited fields"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- prevent self-promotion
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    plan = (SELECT plan FROM public.profiles WHERE id = auth.uid()) AND
    access_level = (SELECT access_level FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Profile created by trigger"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── MODULES policies ──────────────────────────────────────
CREATE POLICY "Published modules readable by authenticated users"
  ON public.modules FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    (status = 'published' OR public.is_admin())
  );

CREATE POLICY "Admins manage modules"
  ON public.modules FOR ALL
  USING (public.is_admin());

-- ── VIDEOS policies ───────────────────────────────────────
CREATE POLICY "Free published videos readable by all authenticated"
  ON public.videos FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    status = 'published' AND
    (access_level = 'free' OR public.is_gold())
  );

CREATE POLICY "Admins see all videos"
  ON public.videos FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins manage videos"
  ON public.videos FOR ALL
  USING (public.is_admin());

-- ── VIDEO PROGRESS policies ───────────────────────────────
CREATE POLICY "Users manage own progress"
  ON public.video_progress FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all progress"
  ON public.video_progress FOR SELECT
  USING (public.is_admin());

-- ── ANNOUNCEMENTS policies ────────────────────────────────
CREATE POLICY "Users read relevant announcements"
  ON public.announcements FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    status = 'published' AND (
      audience = 'all' OR
      (audience = 'gold' AND public.is_gold()) OR
      (audience = 'free' AND NOT public.is_gold())
    ) OR public.is_admin()
  );

CREATE POLICY "Admins manage announcements"
  ON public.announcements FOR ALL
  USING (public.is_admin());

-- ── LIVE SESSIONS policies ────────────────────────────────
CREATE POLICY "Authenticated users read accessible sessions"
  ON public.live_sessions FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    (access_level = 'free' OR public.is_gold()) OR public.is_admin()
  );

CREATE POLICY "Admins manage live sessions"
  ON public.live_sessions FOR ALL
  USING (public.is_admin());

-- ── RESOURCES policies ────────────────────────────────────
CREATE POLICY "Users read accessible resources"
  ON public.resources FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    status = 'published' AND
    (access_level = 'free' OR public.is_gold()) OR public.is_admin()
  );

CREATE POLICY "Admins manage resources"
  ON public.resources FOR ALL
  USING (public.is_admin());

-- ── USER MODULE PROGRESS policies ────────────────────────
CREATE POLICY "Users manage own module progress"
  ON public.user_module_progress FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all module progress"
  ON public.user_module_progress FOR SELECT
  USING (public.is_admin());

-- ── PLATFORM SETTINGS policies ───────────────────────────
CREATE POLICY "Authenticated users read settings"
  ON public.platform_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage settings"
  ON public.platform_settings FOR ALL
  USING (public.is_admin());
