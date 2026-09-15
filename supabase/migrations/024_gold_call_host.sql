-- ─────────────────────────────────────────────────────────────────────────
-- Gold Desk Funnel — Part 7: call host tracking
--
-- Records which team member's name the "Invited To Call" email went out
-- under (Bani / AB / Mubz for now — a small, hand-picked set of admins who
-- actually run these calls, not the full admin list and not the separate
-- mentor_profiles/role='mentor' system, which belongs to the unrelated
-- paid-programme credit-based booking feature).
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.gold_applications
  ADD COLUMN IF NOT EXISTS call_host_id uuid REFERENCES public.profiles;
