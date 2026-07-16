-- 070_fix_scenario_mapping_and_prices.sql
-- Retter opp A/B/C-forvirringen: koden (069) hadde A = prosjektoverføring/engangs
-- og C = tier-abonnement. Riktig definisjon (prosjektinstruks) er:
--   A = Full driftsavtale (abonnement, tier Lav/Medium/Høy)
--   B = Serverløs gratis hosting (engangs)          — uendret
--   C = Full overføring (engangs, 50 000–100 000 kr) — var A
-- Bytter derfor A ↔ C i pricing_tiers.scenario og business_customers.business_model,
-- og oppdaterer tier-prisene fra 690/1190/1990 til 790/1690/2190 kr/mnd samt
-- timesats fra 690 til 790 kr/t i beskrivelser/juridisk_scope.
-- Kjør manuelt i Supabase SQL Editor.

-- ── 1) business_customers: bytt A ↔ C (midlertidig verdi for å unngå kollisjon) ──
UPDATE public.business_customers SET business_model = '_TMP_' WHERE business_model = 'A';
UPDATE public.business_customers SET business_model = 'A'     WHERE business_model = 'C';
UPDATE public.business_customers SET business_model = 'C'     WHERE business_model = '_TMP_';

-- ── 2) pricing_tiers: bytt A ↔ C på samme måte ───────────────────────────────
UPDATE public.pricing_tiers SET scenario = '_TMP_' WHERE scenario = 'A';
UPDATE public.pricing_tiers SET scenario = 'A'      WHERE scenario = 'C';
UPDATE public.pricing_tiers SET scenario = 'C'      WHERE scenario = '_TMP_';

-- ── 3) Oppdater tier-priser (nå under scenario='A') fra 690/1190/1990 til 790/1690/2190 ──
UPDATE public.pricing_tiers
SET pris_nok = 790,
    beskrivelse = 'Hosting og SSL via tredjepart. Leverandøren overvåker og varsler ved avvik.',
    juridisk_scope = 'Leveransen omfatter løpende drift og hosting av nettsiden via tredjepart (Cloudflare Pages / Vercel / Netlify). For Lav-pakken (790 kr/mnd) dekkes utelukkende serverleie, SSL og overvåkning. Leverandøren overvåker nettsiden og varsler kunden ved kjente avvik. Teknisk support eller innholdsendringer er ikke inkludert og faktureres med gjeldende timesats på 790 kr/t eks. mva. Denne begrensningen gjelder utelukkende for nye avtaler og er ikke retroaktivt gjeldende for kunder med eldre avtaler.'
WHERE scenario = 'A' AND tier = 'Lav';

UPDATE public.pricing_tiers
SET pris_nok = 1690,
    beskrivelse = 'Alt i Lav + maks 2 mikroendringer per måned. Overforbruk: 1 050 kr/t.',
    juridisk_scope = 'Leveransen omfatter løpende drift, hosting og månedlig vedlikehold via tredjepart. Medium-pakken (1 690 kr/mnd) inkluderer maks 2 mikroendringer per måned. Overforbruk utover inkludert kvote faktureres med 1 050 kr/t eks. mva, dokumentert med tidslogg.'
WHERE scenario = 'A' AND tier = 'Medium';

UPDATE public.pricing_tiers
SET pris_nok = 2190,
    beskrivelse = 'Alt i Medium + 1 oppdatering per uke. Overforbruk utover 1/uke: 1 050 kr/t.',
    juridisk_scope = 'Leveransen omfatter løpende drift, hosting og ukentlig vedlikehold via tredjepart. Høy-pakken (2 190 kr/mnd) inkluderer 1 oppdatering per uke. Overforbruk utover én endring per uke faktureres med 1 050 kr/t eks. mva, dokumentert med tidslogg.'
WHERE scenario = 'A' AND tier = 'Høy';

-- ── 4) Timesats-referanser i C (nå full overføring, var A) og B: 690 → 790 kr/t ──
-- Prisintervallet for C endres samtidig fra 10 000–20 000 (gammel A-verdi) til
-- 50 000–100 000, iht. prosjektinstruks for "Full overføring".
UPDATE public.pricing_tiers
SET pris_nok = 50000,
    pris_til_nok = 100000,
    beskrivelse = 'Kunden overtar prosjektet etter godkjent leveranse. Videre arbeid faktureres per time.',
    juridisk_scope = 'Leveransen omfatter design og oppsett av én komplett nettside. Før offisiell overføring skal kunden skriftlig godkjenne at leveransen oppfyller avtalte kriterier. Etter fullført «Transfer» i Lovable.dev overtar kunden løsningen fullt ut, reklamasjonsperioden avsluttes, og alt fremtidig arbeid eller support faktureres etter gjeldende timesats på 790 kr/t eks. mva.'
WHERE scenario = 'C' AND tier IS NULL;

UPDATE public.pricing_tiers
SET juridisk_scope = 'Leveransen omfatter design og oppsett av én komplett nettside eksportert til gratis hosting via tredjepart (Cloudflare Pages / Vercel / Netlify). Innenfor de første 90 dagene etter signert overlevering («avtaledato») kan endringer avtales uten ekstra oppstartsgebyr. Etter utløpt 90-dagersfrist utløses automatisk et gjenoppstartsgebyr på 490 kr eks. mva per endringsforespørsel, i tillegg til ordinær timesats på 790 kr/t eks. mva (minimum 1 time). Gjenoppstartsgebyret inkluderer nødvendig gjennomgang av tidligere leveranse før arbeidet gjenopptas, og forfaller ved bestilling.'
WHERE scenario = 'B' AND tier IS NULL;

-- ── 5) Bump versjon + gyldig_fra på alle rader som ble endret i steg 3–4 ──────
UPDATE public.pricing_tiers
SET versjon = versjon + 1,
    gyldig_fra = current_date
WHERE (scenario = 'A' AND tier IN ('Lav','Medium','Høy'))
   OR (scenario = 'C' AND tier IS NULL)
   OR (scenario = 'B' AND tier IS NULL);

-- ── Verifiser etter kjøring ────────────────────────────────────────────────────
-- select scenario, tier, pris_nok, enhet from public.pricing_tiers order by scenario, tier;
-- select business_model, count(*) from public.business_customers group by business_model;
