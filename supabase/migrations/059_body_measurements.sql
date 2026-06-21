-- 059: Kroppsmålinger (vekt/høyde tidsserie)
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date NOT NULL DEFAULT current_date,
  weight_kg   numeric(5,2),
  height_cm   numeric(5,1),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.body_measurements;
CREATE POLICY "authenticated_full_access" ON public.body_measurements
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
REVOKE ALL ON public.body_measurements FROM anon;
