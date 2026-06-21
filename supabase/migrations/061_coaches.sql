-- 061: Trenere
CREATE TABLE IF NOT EXISTS public.coaches (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  role       text NOT NULL,          -- f.eks. Hovedtrener, Assistent, Friidrett, Fotball, Styrke, Fysio
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.coaches;
CREATE POLICY "authenticated_full_access" ON public.coaches
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
REVOKE ALL ON public.coaches FROM anon;
