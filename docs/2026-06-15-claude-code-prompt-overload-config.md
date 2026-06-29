# Claude Code-prompt — konfigurerbar Overload-coach (2026-06-15)

Du jobber på Filips helse-/treningsdashboard (vanilla HTML/CSS/JS, Vercel +
Supabase, tospråklig norsk/engelsk). **Les `CLAUDE.md` i rotmappa først** — i18n-
reglene er ufravikelige: all synlig tekst i BÅDE `TRANSLATIONS.no` og `.en` i
`utils.js`, dynamisk tekst gjennom `t()`, re-render ved språkbytte (`onLangChange`).
Bekreft før sletting/overskriving. Kjør `npm run check` (i18n + nav) før du er ferdig.

## Mål
Gjør Progressive Overload-coachen i `gym.html` konfigurerbar per øvelse, via et eget
panel åpnet fra en NY knapp ved siden av de tre eksisterende i treningsoversikten
(`treningsplan.html`: «Rediger ukeplan», «Plager», «Fysio-notat»). Filip skal selv
kunne justere hvordan coachen oppfører seg uten å røre kode.

## Bakgrunn (eksisterende kode — bygg på dette, ikke parallelt)
- PO-coachen bor i `gym.html`, funksjonen `renderPOCoach` (~linje 1505–1607). Den
  leser per-sett-historikk fra tabellen `set_log` og viser «hold» / «+2.5 kg» per
  øvelse via `po.*`-nøkler.
- Anbefalt rep-intervall ligger i dag som fritekst i `workout_program.reps`
  (f.eks. "10–12").
- Regelen (dobbel progresjon) settes opp av Opus i en egen oppgave: alle arbeidssett
  ≥ toppen av intervallet → anbefal +steg; ellers hold. **Ikke endre selve regelen
  her — bare gjør parametrene den bruker konfigurerbare.**

## Hva du skal lage

### 1. Migrasjon — ny tabell
`supabase/migrations/045_overload_config.sql` (enbruker-app, samme mønster som
`set_log`/`workout_program`: ingen user_id):
```
CREATE TABLE IF NOT EXISTS overload_config (
  exercise_name text PRIMARY KEY,
  rep_min       integer,        -- overstyrer intervall fra workout_program.reps
  rep_max       integer,
  step_kg       numeric DEFAULT 2.5,   -- vektøkning når toppen nås
  pain_limit    integer DEFAULT 3,     -- knee_max-grense som holder igjen progresjon
  enabled       boolean DEFAULT true   -- av = coachen hopper over øvelsen
);
```
Legg til samme RLS-/grant-mønster som migrasjon 031/044 bruker for authenticated.

### 2. Konfig-panel (UI)
- Ny knapp i `treningsplan.html` ved siden av de tre eksisterende (samme stil/ikon-
  konvensjon). Tekst via `data-i18n`, f.eks. `tp.overload_config` = «Overload-coach»
  / «Overload coach».
- Knappen åpner et panel/modal som lister alle distinkte øvelser fra
  `workout_program` (hovedøvelser, dropp rehab/cardio). Per øvelse, redigerbart:
  rep-intervall (min–max), vektsteg (kg), smertegrense, på/av-bryter.
- Lagre → upsert i `overload_config`. Tomt intervall = fall tilbake på
  `workout_program.reps`. Standardverdier som i tabellen over.

### 3. Coachen leser config
I `renderPOCoach` (`gym.html`): hent `overload_config` sammen med `set_log`. Per
øvelse, bruk override hvis den finnes (rep_min/max, step_kg, pain_limit), ellers
parse intervall fra `workout_program.reps` + standardverdier. `enabled=false` →
hopp over øvelsen i coachen.

## Krav
- Tospråklig overalt (no + en, lik nøkkeltelling — `npm run check`).
- Re-render panel + coach ved språkbytte.
- Foreslå tilnærming og vis filendringer før du koder. Test begge språk.
- List endrede filer til slutt.
