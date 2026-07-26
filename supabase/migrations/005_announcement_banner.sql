-- Adds an optional hero/banner image to announcements, shown both in the
-- announcement email and (if present) on the on-site announcement card.
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS banner_url text;
