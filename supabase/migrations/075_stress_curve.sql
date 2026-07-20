-- 075: Stress-kurve gjennom døgnet i health_data.
--
-- 040 la til stress_avg (ett snittall for dagen). Det er for grovt til å tegne
-- mot body battery-kurven — en flat strek sier ingenting om NÅR på dagen
-- belastningen kom. Garmin sitt dailyStress-endepunkt returnerer allerede
-- stressValuesArray i samme respons som vi henter bodyBatteryValuesArray fra,
-- så dette koster ingen ekstra API-kall i syncen.
--
-- Format, identisk med body_battery_curve: [[epoch_sekunder_GMT, nivå], ...]
-- Nivå 0–100. Garmin bruker negative verdier (-1/-2) for "måler ikke" /
-- "for lite data" — de filtreres bort i syncen, ikke her.
--
-- Kjør i Supabase SQL Editor.

ALTER TABLE public.health_data ADD COLUMN IF NOT EXISTS stress_curve jsonb;

COMMENT ON COLUMN public.health_data.stress_curve IS
  'Stressnivå gjennom døgnet: [[epoch_sek_GMT, nivå_0_100], ...]. Kilde: Garmin dailyStress.stressValuesArray.';

-- health_data har allerede RLS fra 052/senere, men ALTER TABLE ADD COLUMN
-- rører ikke policyer — så dette er kun en verifisering, ikke en endring.
-- Kjør denne etterpå og bekreft at health_data har rls_på = true:
--
--   select relname, relrowsecurity as rls_på,
--    (select count(*) from pg_policies p where p.tablename=c.relname) as policies
--   from pg_class c join pg_namespace n on n.oid=c.relnamespace
--   where n.nspname='public' and c.relkind='r' and relname='health_data';
--
-- Skulle den mot formodning vise false, kjør blokka under (idempotent):

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'health_data' AND c.relrowsecurity
  ) THEN
    ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.health_data FORCE  ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "authenticated_full_access" ON public.health_data;
    CREATE POLICY "authenticated_full_access" ON public.health_data
      FOR ALL USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
    REVOKE ALL ON public.health_data FROM anon;
    RAISE NOTICE 'health_data manglet RLS — skrudd på nå.';
  END IF;
END $$;
