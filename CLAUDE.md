# CLAUDE.md — Filip's Dashboard

Personlig helse-/treningsdashboard. Vanilla HTML/CSS/JS, Vercel + Supabase.
Svar kort og token-effektivt.

## TERMINAL — VIKTIG!
Etter hvert oppdrag eller når noe er ferdig, skal du skrive nøyaktig hva jeg kan kopiere til terminal for å pushe til main, committe, adde, eller cd, eller noe med index eller head lock som er stuck. Etter hver oppgave vil jeg ha det mulig å kopiere.

## ⚠️ KRITISK: RLS på ALLE tabeller

Anon-nøkkelen ligger i klienten (offentlig). Supabase eksponerer auto-REST for
hver tabell i `public` — **uten RLS er tabellen lese-/skriv-/slettbar for hvem
som helst på internett.** Derfor:

**Hver gang du lager en ny tabell (`CREATE TABLE`) MÅ samme migrasjon inneholde:**

```sql
ALTER TABLE public.<tabell> ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.<tabell> FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.<tabell>;
CREATE POLICY "authenticated_full_access" ON public.<tabell>
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
REVOKE ALL ON public.<tabell> FROM anon;
```

Enbruker-app → `auth.role() = 'authenticated'` holder (ingen `user_id` nødvendig).
RLS uten policy = default-deny → klienten får tomt. Policy uten `ENABLE RLS` =
inert (gjør ingenting). Begge MÅ være med. Server-kode i `api/` bruker
service_role som bypasser RLS — uberørt.

**Mønster + full bakgrunn:** `supabase/migrations/052_enable_rls_all_tables.sql`.

**Sjekk før du sier deg ferdig — alle tabeller skal ha `rls_på = true`:**
```sql
select relname, relrowsecurity as rls_på,
 (select count(*) from pg_policies p where p.tablename=c.relname) as policies
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' order by rls_på, relname;
```

## ⚠️ KRITISK: Tospråklig (norsk + engelsk)

Dashboardet har en språkbryter (🇳🇴/🇺🇸, `langBtn` → `toggleLang()`). Filip
bruker BÅDE norsk (hjemme) og engelsk (USA høst 2026 – vår 2027, viser det til
trenere). **ALL tekst brukeren ser MÅ være tospråklig.** Aldri hardkod norsk
(eller engelsk) tekst som vises på skjermen.

### Regelen — hver gang du legger til eller endrer synlig tekst:

1. **Statisk HTML-tekst** → bruk attributt, ikke ren tekst:
   - `<span data-i18n="dash.sleep">Søvn</span>`
   - placeholder: `data-i18n-placeholder="..."`, title: `data-i18n-title="..."`,
     HTML m/markup: `data-i18n-html="..."`
2. **Tekst generert i JavaScript** → ALLTID gjennom `t('nøkkel')`:
   - `el.innerHTML = t('gym.no_history')` — aldri `el.innerHTML = 'Ingen økter'`
   - med variabler: `t('sprint.runs_saved', { n: 3 })`
3. **Legg nøkkelen i BEGGE språk** i `utils.js` → `TRANSLATIONS.no` OG
   `TRANSLATIONS.en`. Begge objektene MÅ ha nøyaktig like mange nøkler.
4. **Dato/ukedag/måned-navn** → bruk `fmtLocale()` med `Intl`/`toLocaleDateString`,
   ikke hardkodede norske navn-arrays. Eksempel finnes i `kalender.html` (`DAYS_FULL()`,
   `MONTHS_FULL()` osv).
5. **Dynamisk innhold må re-rendres ved språkbytte.** Hver side definerer
   `onLangChange = () => { applyLang(); <re-render dynamiske deler>; }`. `toggleLang()`
   i utils.js kaller denne. Uten den blir JS-generert tekst stående på gammelt språk
   til full sidelasting.

### Sjekk før du er ferdig (i mappa):
```bash
node --check utils.js
# begge språk like mange nøkler:
node -e "const s=require('fs').readFileSync('utils.js','utf8');const o=s.indexOf('{',s.indexOf('const TRANSLATIONS'));let d=0,e=-1;for(let i=o;i<s.length;i++){if(s[i]=='{')d++;if(s[i]=='}'){d--;if(!d){e=i;break;}}}const T=eval('('+s.slice(o,e+1)+')');console.log('no',Object.keys(T.no).length,'en',Object.keys(T.en).length)"
```
`no` og `en` skal vise samme tall. Test ALLTID begge språk i nettleseren før du sier
deg ferdig — trykk 🇺🇸 og let etter norsk tekst som lekker, og motsatt.

## i18n-systemet (hvordan det funker)
- `utils.js`: `TRANSLATIONS = { no: {...}, en: {...} }`, `_lang` fra localStorage,
  `t(key, vars)`, `applyLang()` (oppdaterer alle `[data-i18n*]`), `toggleLang()`.
- Nøkkel-navngiving: `prefiks.navn` per side — `nav.`, `dash.`, `gym.`, `sprint.`,
  `sovn.`, `gm.`, `kal.`, `tp.`, `ai.`, `login.`, felles uten prefiks (`save`, `cancel`).

## Filer (alle .html i rot, deler `utils.js` + `styles.css`)
- `dashboard.html` — oversikt: søvn, kne, dagens økt, fokus-liste, gjøremål, kalender, ukestripe
- `gym.html` — styrkeøkt-logger, knesmerte per fase, ukeplan man/ons/fre
- `sprint.html` — sprint-logger, PB-tracker, knetrend
- `sovn.html` — søvnhistorikk (Chart.js: score, HRV, RHR, stadier)
- `gjoremal.html` — todo-app m/lister, forfallsdatoer
- `kalender.html` — måneds-/ukevisning + tidslinje, Google Calendar + egne hendelser
- `treningsplan.html` — ukeplan + øktlogg (klikk-for-detalj-drawer)
- `ai.html` + `api/ai-chat.js` — AI Overseer-chat (Claude Sonnet 4.6), live treningsdata som kontekst
- `login.html` — Supabase e-post/passord
- DB: Supabase (Postgres). Migrasjoner i `supabase/migrations/`.

## ⚠️ Ukeplan-kilder (ikke gjenbruk `training_plan`)
To lag, ingen andre:
- `weekly_plan` (`day`, `session_type`) — den FASTE standarduka. Eneste kilde til
  fast plan. Redigeres via «Rediger ukeplan»-knappen (`saveWeeklyPlan`).
- `training_plan_weekly` (`week_monday`, `day_index`, `session_text`, `notes`) —
  per-dag-OVERSTYRING, dato-forankret på ukens mandag. Gjelder kun den uka og
  «utløper» når mandagen skifter. Brukes for ALLE uker, inkl. inneværende.

Visning = `weekly_plan` som base, `training_plan_weekly` (ukens mandag) overstyrer.
`session_text === ''` = dagen eksplisitt tømt (hvile), faller IKKE tilbake til weekly_plan.
Lest tre steder som MÅ holdes i sync: `treningsplan.html`, `dashboard.html`,
`api/_lib/context.js`.

`training_plan` (008) er UTFASET — datoløst lag som lekket overstyringer mellom uker
(fikset i migr. 034). Ikke les/skriv det igjen.

## Kontekst om Filip (for AI-relatert kode)
17 år, sprinter (100/200m) + styrke, 70kg/187cm, ~6 økter/uke. Patellar tendinopati
venstre kne (jan 2026). Driver også fotball/basket i USA. Smerteskala 0–10 i alle logger.

## Generelt
- Bekreft før sletting/overskriving av filer. Ikke rør filer utenfor denne mappa.
- List endrede filer til slutt. Verifiser `node --check` på endret JS.
