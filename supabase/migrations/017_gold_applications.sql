-- ─────────────────────────────────────────────────────────────────────────
-- Gold Desk Funnel — Part 1: applications
--
-- "Week 1 Free" application intake for the 12-week Gold Desk programme. Every
-- applicant is an existing authenticated member (free course -> dashboard ->
-- apply) — user_id is NOT NULL, unlike the spec's suggested nullable FK.
-- No booking calendar, no capacity counter anywhere near this table — "25
-- places available" is marketing copy that lives in gold_funnel_config
-- (018), never a row count against this table.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gold_applications (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,

  full_name              text NOT NULL,
  email                  text NOT NULL,
  phone_number           text NOT NULL,
  phone_verified         boolean NOT NULL DEFAULT false,
  phone_verified_at      timestamptz,
  country                text,
  is_over_18             boolean NOT NULL DEFAULT false,

  trading_experience     text,
  markets_traded         jsonb NOT NULL DEFAULT '[]',
  trading_level          text,
  prop_firm_funded       boolean NOT NULL DEFAULT false,
  funded_capital         text,
  personal_account       boolean NOT NULL DEFAULT false,
  biggest_challenge      text,

  why_join               text,
  programme_goal         text,
  current_obstacle       text,
  commitment_level       text,
  twelve_month_goal      text,
  additional_information text,

  status                 text NOT NULL DEFAULT 'new' CHECK (status IN (
                            'new', 'reviewing', 'qualified', 'rejected',
                            'invited_to_call', 'accepted_week_one', 'enrolled', 'archived'
                          )),
  qualification_score    integer CHECK (qualification_score BETWEEN 1 AND 10),
  admin_notes            text,
  assigned_admin         uuid REFERENCES public.profiles,

  submitted_at           timestamptz NOT NULL DEFAULT now(),
  reviewed_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  CHECK (phone_verified = false OR phone_verified_at IS NOT NULL)
);

-- One active application per user — accidental double-submit and re-apply
-- while already in the pipeline are blocked at the DB layer, not just the
-- UI. A rejected or archived applicant CAN apply again (row falls outside
-- this partial index once its status moves there).
CREATE UNIQUE INDEX IF NOT EXISTS uq_gold_applications_active_user
  ON public.gold_applications (user_id)
  WHERE (status NOT IN ('rejected', 'archived'));

CREATE INDEX IF NOT EXISTS idx_gold_applications_status_submitted
  ON public.gold_applications (status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_gold_applications_assigned
  ON public.gold_applications (assigned_admin);

DROP TRIGGER IF EXISTS set_updated_at ON public.gold_applications;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.gold_applications
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.gold_applications ENABLE ROW LEVEL SECURITY;

-- Applicant can see and create only their own row. Status/notes/scoring
-- changes are admin/service-role only — no member UPDATE policy is granted.
CREATE POLICY "Applicants read own application"
  ON public.gold_applications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- INSERT is further gated by is_gold_applications_open() once 018 defines it
-- (that migration replaces this policy) — kept simple here so 017 is valid
-- to run standalone before 018 exists.
CREATE POLICY "Applicants create own application"
  ON public.gold_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage applications"
  ON public.gold_applications FOR ALL
  USING (public.is_admin());
