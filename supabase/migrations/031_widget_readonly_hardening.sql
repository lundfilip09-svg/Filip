-- 031_widget_readonly_hardening.sql
-- =================================================================
-- Hjemmeskjerm-widgets (iPhone + Mac) leser via api/widget.js, som bruker
-- service_role-nøkkelen SERVER-SIDE. service_role OMGÅR RLS, så widgeten
-- trenger INGEN ny lese-policy.
--
-- Denne migrasjonen åpner derfor ingenting. Den LÅSER NED (defense-in-depth):
-- selv om anon-nøkkelen (som ligger offentlig i frontend) lekker, skal ingen
-- kunne lese eller skrive disse tabellene direkte mot Supabase REST.
--
-- Hvorfor dette er trygt mot "skrivetilgang":
--   * Eksisterende policy (003) krever auth.role() = 'authenticated'.
--   * Med RLS PÅ + ingen anon-policy => anon nektes ALT (les + skriv).
--   * Widgeten skriver aldri; proxyen eksponerer kun GET.
-- =================================================================

-- 1. Bekreft at RLS er aktivt (idempotent — trygt å kjøre på nytt).
alter table public.health_data enable row level security;
alter table public.knee_pain   enable row level security;
alter table public.todos       enable row level security;

-- 2. Tving RLS også for tabell-eiere (ekstra belte: ingen smutthull).
alter table public.health_data force row level security;
alter table public.knee_pain   force row level security;
alter table public.todos       force row level security;

-- 3. Trekk tilbake alle direkte tabell-grants for anon (offentlig nøkkel).
--    Etter dette har anon verken SELECT, INSERT, UPDATE eller DELETE.
revoke all on public.health_data from anon;
revoke all on public.knee_pain   from anon;
revoke all on public.todos       from anon;

-- 4. Sikre at 'todos' har authenticated-policy (003 dekket den ikke).
--    Single-user dashboard: full tilgang for innloggede, ingen for anon.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'todos'
      and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on public.todos
      for all
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;
end $$;

-- 5. MERK: ikke gi anon noen SELECT-policy her. Det er hele poenget —
--    widgeten går via proxyen med service_role, ikke direkte som anon.
