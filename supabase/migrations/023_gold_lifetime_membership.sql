-- ─────────────────────────────────────────────────────────────────────────
-- Gold Desk Funnel — Part 6: lifetime membership question
--
-- Adds the "are you a lifetime member of 5GM Academy or AB's Mentorship?"
-- question the apply flow now collects (see app/dashboard/gold/apply/page.tsx).
-- Multi-select, same jsonb-array pattern as markets_traded — an applicant
-- could hold a lifetime seat in either or both programmes. Lifetime members
-- are eligible for a post-application incentive, decided by staff on review.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.gold_applications
  ADD COLUMN IF NOT EXISTS lifetime_memberships jsonb NOT NULL DEFAULT '[]';
