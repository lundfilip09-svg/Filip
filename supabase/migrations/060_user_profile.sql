-- 060: Brukerprofil (én rad)
CREATE TABLE IF NOT EXISTS public.user_profile (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      text,
  birth_date     date,
  dominant_leg   text CHECK (dominant_leg IN ('left','right')),
  training_phase text CHECK (training_phase IN ('pre_season','competition','off_season','transition')),
  height_cm      numeric(5,1),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.user_profile;
CREATE POLICY "authenticated_full_access" ON public.user_profile
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
REVOKE ALL ON public.user_profile FROM anon;
