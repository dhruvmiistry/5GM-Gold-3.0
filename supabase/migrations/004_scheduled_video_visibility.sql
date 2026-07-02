-- ─────────────────────────────────────────────────────────────────────────
-- 5GM Gold — Migration 004: Scheduled video visibility (countdown release)
-- ─────────────────────────────────────────────────────────────────────────
-- Previously only status = 'published' videos were selectable, so a
-- 'scheduled' video (release_date set, not yet live) was completely
-- invisible to clients — no way to render a "coming soon" countdown card
-- for it ahead of time. This widens the read policy to also allow
-- 'scheduled' rows so upcoming content can be teased, while
-- app/api/videos/free/route.ts (the actual watch surface) still gates
-- playback by comparing release_date to the current time.

DROP POLICY IF EXISTS "Free published videos readable by all authenticated" ON public.videos;

CREATE POLICY "Free published or scheduled videos readable by all authenticated"
  ON public.videos FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    status IN ('published', 'scheduled') AND
    (access_level = 'free' OR public.is_gold())
  );
