-- ─────────────────────────────────────────────────────────────────────────
-- Add explicit lesson/video ordering within a module
-- Run after 005_announcement_banner.sql
--
-- videos.release_date/created_at cannot reliably express curriculum order
-- (e.g. The Reset's 20 lessons in a fixed sequence). Mirrors modules.sort_order.
-- Additive, non-destructive: new column, NOT NULL DEFAULT 0, no data touched.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_videos_module_sort ON public.videos (module_id, sort_order);
