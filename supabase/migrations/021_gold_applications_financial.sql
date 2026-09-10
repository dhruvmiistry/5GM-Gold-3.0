-- ─────────────────────────────────────────────────────────────────────────
-- Gold Desk Funnel — Part 5: employment screening
--
-- Adds the employment-status field the apply flow now collects (see
-- app/dashboard/gold/apply/page.tsx).
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.gold_applications
  ADD COLUMN IF NOT EXISTS employment_status text;
