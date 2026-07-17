-- 071_repair_pricing_tiers_data.sql
-- FEIL FUNNET: pricing_tiers stod i FEIL tilstand — 070 var aldri kjørt, så A/C var
-- byttet om OG tier-prisene var gamle (690/1190/1990). Faktisk DB før denne migrasjonen:
--   A/NULL   10000–20000 engangs   (skulle vært C)
--   B/NULL   490          engangs   (korrekt)
--   C/Lav|Medium|Høy 690/1190/1990 mnd  (skulle vært A, med nye priser)
--
-- Denne migrasjonen erstatter 070+071: den SLETTER alle pricing_tiers-rader og
-- setter inn korrekt sluttilstand på nytt. Helt idempotent — trygg uansett hvilken
-- tilstand tabellen er i nå. Fikser også A↔C på eksisterende kunder.
--
-- Fasit (prosjektinstruks):
--   A = Full driftsavtale (abonnement) — Lav 790 / Medium 1690 / Høy 2190 kr/mnd
--   B = Serverløs gratis hosting (engangs) — 490 kr oppstart
--   C = Full overføring (engangs) — 50 000–100 000 kr
--   Timesats 790 kr/t. Overforbruk Medium/Høy: 1 050 kr/t.
--
-- Kjør manuelt i Supabase SQL Editor. Trygg å kjøre flere ganger.

BEGIN;

-- ── 1) Fiks A↔C på eksisterende kunder (kun hvis 070 aldri kjørte) ───────────────
-- Trygt idempotent via _TMP_-triks; hvis allerede korrekt gjør dette ingenting galt
-- så lenge ingen kunde har business_model = '_TMP_'.
UPDATE public.business_customers SET business_model = '_TMP_' WHERE business_model = 'A';
UPDATE public.business_customers SET business_model = 'A'     WHERE business_model = 'C';
UPDATE public.business_customers SET business_model = 'C'     WHERE business_model = '_TMP_';

-- ── 2) Nullstill pricing_tiers og bygg korrekt sluttilstand ──────────────────────
DELETE FROM public.pricing_tiers;

INSERT INTO public.pricing_tiers
  (scenario, tier, pris_nok, pris_til_nok, enhet, beskrivelse, features, juridisk_scope, versjon, gyldig_fra)
VALUES

-- A · abonnement (kr/mnd)
('A', 'Lav', 790, NULL, 'mnd',
 'Hosting, SSL og oppetid via tredjepart. 0 innholdsendringer inkludert.',
 '[{"icon":"check","key":"biz.sc_lav_f1"},{"icon":"check","key":"biz.sc_lav_f2"},{"icon":"warn","key":"biz.sc_lav_f4"}]',
 'Leveransen omfatter løpende drift og hosting av nettsiden via tredjepart (Cloudflare Pages / Vercel / Netlify). For Lav-pakken (790 kr/mnd) dekkes utelukkende serverleie, SSL og oppetid. Ingen innholdsendringer er inkludert; teknisk arbeid faktureres med gjeldende timesats på 790 kr/t inkl. mva.',
 2, current_date),

('A', 'Medium', 1690, NULL, 'mnd',
 'Alt i Lav + maks 2 mikroendringer per måned. Overforbruk: 1 050 kr/t.',
 '[{"icon":"check","key":"biz.sc_med_f1"},{"icon":"check","key":"biz.sc_med_f2"},{"icon":"warn","key":"biz.sc_med_f3"}]',
 'Leveransen omfatter løpende drift, hosting og månedlig vedlikehold via tredjepart. Medium-pakken (1 690 kr/mnd) inkluderer maks 2 mikroendringer per måned. Overforbruk utover inkludert kvote faktureres med 1 050 kr/t inkl. mva, dokumentert med tidslogg.',
 2, current_date),

('A', 'Høy', 2190, NULL, 'mnd',
 'Alt i Medium + ukentlige justeringer (1 økt/uke). Overforbruk: 1 050 kr/t.',
 '[{"icon":"check","key":"biz.sc_hoy_f1"},{"icon":"check","key":"biz.sc_hoy_f2"},{"icon":"warn","key":"biz.sc_hoy_f3"}]',
 'Leveransen omfatter løpende drift, hosting og ukentlig vedlikehold via tredjepart. Høy-pakken (2 190 kr/mnd) inkluderer 1 oppdatering per uke. Overforbruk utover én endring per uke faktureres med 1 050 kr/t inkl. mva, dokumentert med tidslogg.',
 2, current_date),

-- B · serverløs gratis hosting (engangs)
('B', NULL, 490, NULL, 'engangs',
 'Gratis serverløs hosting. Ingen kodetilgang for kunde. Endringer via byrået.',
 '[{"icon":"check","key":"biz.sb_f1"},{"icon":"warn","key":"biz.sb_f4"}]',
 'Leveransen omfatter design og oppsett av én komplett nettside eksportert til gratis hosting via tredjepart (Cloudflare Pages / Vercel / Netlify). Innenfor de første 90 dagene etter signert overlevering («avtaledato») kan endringer avtales uten ekstra oppstartsgebyr. Etter utløpt 90-dagersfrist utløses automatisk et gjenoppstartsgebyr på 490 kr inkl. mva per endringsforespørsel, i tillegg til ordinær timesats på 790 kr/t inkl. mva (minimum 1 time).',
 2, current_date),

-- C · full overføring (engangs)
('C', NULL, 50000, 100000, 'engangs',
 'Full overføring til kundens egen Lovable-konto etter sluttbetaling.',
 '[{"icon":"check","key":"biz.sc_f1"},{"icon":"warn","key":"biz.sc_f2"}]',
 'Leveransen omfatter design og oppsett av én komplett nettside. Før offisiell overføring skal kunden skriftlig godkjenne at leveransen oppfyller avtalte kriterier. Etter fullført «Transfer» i Lovable.dev overtar kunden løsningen fullt ut, reklamasjonsperioden avsluttes, og alt fremtidig arbeid eller support faktureres etter gjeldende timesats på 790 kr/t inkl. mva.',
 2, current_date);

COMMIT;

-- ── Verifiser etter kjøring ──────────────────────────────────────────────────────
-- select scenario, tier, pris_nok, pris_til_nok, enhet from public.pricing_tiers order by scenario, tier;
-- Forventet: A/Lav 790 mnd · A/Medium 1690 mnd · A/Høy 2190 mnd · B 490 engangs · C 50000–100000 engangs
-- select business_model, count(*) from public.business_customers group by business_model;
