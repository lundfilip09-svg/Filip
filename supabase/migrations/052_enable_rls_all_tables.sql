-- 052_enable_rls_all_tables.sql
-- Skrur på Row Level Security + authenticated-policy på alle public-tabeller
-- som manglet det. Anon-nøkkelen ligger i klienten, så uten RLS er disse
-- tabellene lese-/skrivbare for hvem som helst via Supabase auto-REST.
--
-- Samme mønster som injury_pain (043): kun innloggede (authenticated) får
-- tilgang, anon revokes. Enbruker-app, så auth.role()='authenticated' holder
-- (ingen avhengighet av user_id-kolonne, ingen risiko for å skjule rader).
--
-- Idempotent: trygg å kjøre uansett nåværende tilstand, og å kjøre flere ganger.

DO $$
DECLARE
  t text;
  tbls text[] := array[
    -- manglet RLS helt (kjernedata: trening + skade + todo)
    'gym_log','sprint_log','sprint_records','set_log','knee_pain',
    'injuries','todos','workout_program','gym_days','ai_notes',
    -- hadde RLS men manglet policy (default-deny -> klient fikk tomt)
    'active_session','activity_log','weekly_summaries'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'hopper over % (finnes ikke)', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_full_access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "authenticated_full_access" ON public.%I '
      'FOR ALL USING (auth.role() = ''authenticated'') '
      'WITH CHECK (auth.role() = ''authenticated'')', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;

  -- Rydd vekk den gamle, inerte user_id-policyen på injuries (RLS var aldri på,
  -- så den gjorde ingenting). Erstattet av authenticated_full_access over.
  IF to_regclass('public.injuries') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "injuries_owner" ON public.injuries';
  END IF;
END $$;
