# Frontend-plan — session_templates (etter migrasjon 051)

Ingen kode skrevet ennå. Dette er rekkefølgen og hva hver fil må endres til.
Prinsipp gjennom hele fasen: **les `template_id` med fallback til den gamle
tekst-kolonnen.** Da fungerer appen identisk for rader som ennå ikke er backfillet,
og ingenting brekker før den destruktive `052` kjøres.

Kartlagt datamodell i dag:
- `gym.html` nøkler ALT på `day`/`day_key` (`'monday'`, `'wednesday'`, `'friday'`,
  `'rehab'`, `'warmup'`, `'friday_warmup'`). Øvelser lever i `allExercises[day][section]`.
- `treningsplan.html`/`dashboard.html`/`context.js` leser fritekst
  (`weekly_plan.session_type`, `training_plan_weekly.session_text`) og oversetter med
  `displaySessionType()` / `_SESSION_TYPE_KEYS`.
- Oppvarming (`warmup`/`friday_warmup`) er DELT på tvers av dager — har ingen `gym_day`
  og fikk derfor ingen `template_id` i 051. Den må behandles som et delt lag, ikke som
  en mal.

## Fase F1 — Plan-siden (lav risiko, dette er selve feature-en Filip ba om)
Mål: velge en mal per ukedag fra biblioteket, frikoblet fra ukedagen. Rører IKKE
gym.html sine interne strukturer.

1. **`treningsplan.html`**
   - Last `session_templates` ved oppstart (`db.from('session_templates').select('*').order('sort_order,name')`).
   - «Rediger ukeplan»-editoren: bytt fritekst-input (`wp-day-${d}`) → `<select>` med
     malene + «Hvile» (tom). Lagre `template_id` i `weekly_plan` (behold også
     `session_type` = malnavn som snapshot inntil 052, så fallback funker).
   - Visning: resolve `template_id → mal`, vis via `i18n_key` (innebygde) eller `name`
     (egendefinerte). Behold `displaySessionType()` som fallback når `template_id` er NULL.
   - `onLangChange`: re-render plan-grid så malnavn bytter språk.

2. **`dashboard.html`**
   - Samme resolve som treningsplan. Fiks samtidig den eksisterende `''`/hvile-
     inkonsekvensen (linje ~582 dropper tomme verdier; med template_id NULL = hvile blir
     dette entydig).

3. **`api/_lib/context.js`**
   - Last `session_templates`. I `planByDay`: bruk `template_id → navn` når satt, ellers
     dagens tekst. NB: AI-øvelser kobles IKKE på her ennå (egen, senere oppgave).
   - Behold `'Hvile'`-fallback i `weekPlanReadable`.

4. **`utils.js`**
   - Legg til i18n-nøkler i BÅDE `no` og `en`: `daytype.sprint` («Sprint»/«Sprint»),
     evt. nye `tp.template_*`-nøkler for editoren. Verifiser lik nøkkel-telling.

## Fase F2 — gym.html (høy risiko, størst jobb — egen runde)
Mål: dag-pills blir mal-drevne; øvelser nøkles på `template_id` i stedet for `day`.
- `loadData`: bygg `allExercises` keyed på `template_id` (fallback `day` så lenge
  kolonnen finnes).
- `renderDayPills`, kopiering, sletting, `saveSession`, `set_log`-skriving: bruk
  `template_id`. `set_log.day_key` forblir tekst-snapshot (skrives som malnavn).
- DELT oppvarming: behold `warmup`/`friday_warmup` som eget lag utenfor malene.
- Mal-editor: opprett/rediger/slett maler, med **duplikat-navn-advarsel** (krav #2) og
  blokkering av sletting av mal i bruk (DB-en gir RESTRICT-feil; vis pen toast).
- Tydelig skille i logge-flyten: «logger kun dagens økt» vs. «endrer standarduka».

## Fase F3 — Opprydding
- Når F1+F2 er verifisert i nettleseren på BEGGE språk: skriv `052_*.sql` som dropper
  `workout_program.day`, `weekly_plan.session_type`, `training_plan_weekly.session_text`
  og `gym_days`. **Backup/eksport av DB før 052.** Bekreft med Filip før kjøring.

## Verifisering hver fase
- `node --check` på endret JS (utils.js).
- Lik nøkkel-telling no/en (kommandoen i CLAUDE.md).
- Test 🇳🇴 og 🇺🇸 i nettleser; let etter lekket tekst.
