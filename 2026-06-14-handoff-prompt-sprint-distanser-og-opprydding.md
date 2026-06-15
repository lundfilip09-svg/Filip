# Handoff-prompt — sprint-distanser DB-drevne (#5) + opprydding av strø-filer (#6)

Du jobber i Filips personlige helse-/treningsdashboard: vanilla HTML/CSS/JS, Vercel +
Supabase (Postgres). Alle `.html` ligger i rot og deler `utils.js` + `styles.css`.
Filip pusher/committer selv. **Svar kort. Bekreft før sletting/overskriving. Ikke rør
filer utenfor mappa.**

## ⚠️ KRITISK: alt brukeren ser MÅ være tospråklig (norsk + engelsk)
Dashboardet har en språkbryter (🇳🇴/🇺🇸). Filip bruker norsk hjemme og engelsk når han
viser data til amerikanske trenere (høst 2026–vår 2027). Aldri hardkod synlig tekst.

- Statisk HTML: `<span data-i18n="prefiks.navn">Tekst</span>` (placeholder:
  `data-i18n-placeholder`, title: `data-i18n-title`).
- JS-generert tekst: ALLTID `t('nøkkel')` / `t('nøkkel', { n: 3 })`.
- Legg nøkkelen i BEGGE språk i `utils.js` → `TRANSLATIONS.no` OG `TRANSLATIONS.en`.
  Begge objektene MÅ ha nøyaktig like mange nøkler.
- Dynamisk innhold må re-rendres ved språkbytte (siden definerer `onLangChange`).

### Sjekk før du sier deg ferdig (kjør i mappa):
```bash
node --check utils.js
# nøkkelparitet — no og en skal vise samme tall:
node -e "const s=require('fs').readFileSync('utils.js','utf8');const o=s.indexOf('{',s.indexOf('const TRANSLATIONS'));let d=0,e=-1;for(let i=o;i<s.length;i++){if(s[i]=='{')d++;if(s[i]=='}'){d--;if(!d){e=i;break;}}}const T=eval('('+s.slice(o,e+1)+')');console.log('no',Object.keys(T.no).length,'en',Object.keys(T.en).length)"
```
Test ALLTID begge språk i nettleseren før du er ferdig.

---

## ⚠️ NYTT siden prompten ble skrevet — PB re-beregnes nå ved sletting
Den andre agenten (Filips hovedøkt) har lagt til at PB **re-beregnes når et løp slettes**,
så en feillogget rask tid ikke blir hengende. To nye, identiske funksjoner finnes nå:
- `recomputeSprintPBs(distances)` i **`sprint.html`** (rett over `deleteSprintDate`).
- `_recomputeSprintPBs(distances)` i **`treningsplan.html`** (over `deleteSprintSession`).

Begge bruker dagens regel: kun `type = 'Stevne'` teller; `60m_celler` hoppes over
(beregnes live i `loadPBs`), `60m_flying` er ikke PB-distanse.

**Når du endrer PB-regelen eller gjør distanser DB-drevne (#5):** oppdater BEGGE disse
funksjonene slik at de matcher den nye regelen. Hvis du innfører et `all_runs_count`-flagg
per distanse (anbefalt i stedet for å hardkode `60m_celler`), bruk samme flagg her — slik
at re-beregning ved sletting og PB-valg ved logging alltid følger samme logikk. Vurder å
sentralisere regelen i én delt funksjon hvis mulig.

## ⚠️ FILKOLLISJON — koordinering
En annen agent jobber SAMTIDIG på `treningsplan.html`, `gym.html`, `kalender.html` og
`utils.js` (tospråklig-fikser). Den agenten rører også **`sprint.html` rundt linje 863**
(`${runs.length} løp` → i18n) — en helt annen region enn det du skal røre.

**Dine filer:** `sprint.html` (GOALS/mål-seksjonen, ca. linje 605–690), evt. en ny
migrasjonsfil i `supabase/migrations/`, og `utils.js` (nye nøkler).
- I `utils.js`: **legg nye nøkler til på egne, nye linjer** (ikke endre eksisterende
  linjer) så git kan auto-merge. Behold no/en-paritet.
- Ikke rør sprint.html rundt linje 863.

---

## Oppgave #5 — gjør sprint-distanser/mål DB-drevne og redigerbare

**Problem.** I `sprint.html` er distansene Filip kan tracke hardkodet:
```js
const GOALS = [
  { dist: '100m', goal: 11.10, start: 11.52, color: '#5BA4F5' },
  { dist: '200m', goal: 22.30, start: 23.11, color: '#6BE3A4' },
];
```
Filip kan derfor aldri legge til f.eks. 60m / 300m / 400m uten kodeendring. Han har
nettopp bedt om at «alt skal kunne endres» (samme frihet som han nå har for gym-øvelser).

**Sånn funker det i dag.** `loadSprintGoals()` leser `sprint_records`-tabellen
(kolonner i dag: `distance text primary key`, `best_time numeric`, `date date`, samt
`baseline_time` og `goal_time` lagt til i migrasjon 017/028). `renderSprintGoals(best)`
(ca. linje 625) itererer over den hardkodede `GOALS`-arrayen og slår sammen med
DB-overstyringer (`_goalOverrides`, `_goalBaselines`). PB lagres allerede i DB; bare
*hvilke distanser som finnes* + default-verdiene er hardkodet.

**Mål.**
1. Distanser skal komme fra DB, ikke fra `GOALS`-konstanten. Filip skal kunne **legge
   til** en ny distanse og **slette** en distanse i UI-et (på samme måte som øvelser kan
   legges til/slettes andre steder i appen).
2. Behold eksisterende redigering av mål-tid (`editGoal`/`saveGoal`) og baseline
   (`resetBaseline`) — de upserter allerede til `sprint_records`.
3. Migrer 100m/200m + deres default goal/start/color som seed slik at ingenting
   forsvinner for Filip. Vurder å legge `baseline_time`/`goal_time`/`color` inn som
   kolonner hvis de ikke finnes (sjekk migrasjon 017 og 028 først — ikke dupliser).
4. **All ny UI-tekst tospråklig** (knapper «Legg til distanse»/«Add distance», «Slett»,
   bekreftelsesdialoger osv. via `t()` + nøkler i begge språk).

**Anbefalt fremgangsmåte.**
- Ny migrasjon `045_sprint_distances.sql` (neste ledige nummer — sjekk
  `supabase/migrations/`, høyeste i dag er 044). Følg mønsteret i eksisterende filer:
  `create table if not exists`, RLS-policy som i `003_rls_policies.sql`/`025`, og en
  seed-INSERT for 100m/200m. Du kan enten utvide `sprint_records` med `color text` og
  en `sort_order`, eller lage egen `sprint_distances`-tabell — velg det enkleste som ikke
  bryter eksisterende lesing.
- Erstatt `GOALS`-konstanten med en `_distances`-liste lastet fra DB i `loadSprintGoals()`.
- Legg til «+ distanse»-knapp + slett-knapp per rad i `renderSprintGoals()`. Slett skal
  fjerne raden i DB og re-rendre (bekreft via `confirm(t('...'))`, ingen ekstra advarsel
  utover det).
- Distanse-input bør valideres (ikke-tom, unik). Default farge hvis ikke valgt.

### ⚠️ PB-regel (NYTT krav fra Filip — overstyrer «ikke rør PB» under)
PB skal **kun** regnes fra stevne (`type = 'Stevne'`). **60m celler (`60m_celler`) er det
ENESTE unntaket** — der teller ALT, også trening.

Dagens kode i `loadPBs()` (`sprint.html` ca. linje 563–585) gjør delvis det MOTSATTE og
må endres:
- I dag beregnes `60m_celler` live fra `sprint_log` med filter
  `.or('type.eq.Trening,type.like.Trening:%')` — altså kun trening. **Endre til at ALLE
  typer teller for 60m_celler** (trening + stevne), raskeste tid vinner.
- For alle andre distanser (`60m`, `100m`, `200m`, + nye distanser fra #5): PB skal kun
  komme fra stevne-løp. I dag leses de fra `sprint_records.best_time` — sjekk hvor den
  kolonnen settes (søk `best_time` på tvers av repoet). Hvis den oppdateres automatisk fra
  `sprint_log`, må den filtreres til `type = 'Stevne'`. Hvis den settes manuelt, dokumentér
  at den skal representere stevne-PB.
- Eventuelle nye distanser fra #5 arver standardregelen (kun stevne), med mindre distansen
  er en celle-/gate-tidtaking à la 60m_celler — vurder et flagg på distanse-raden
  (f.eks. `all_runs_count boolean`) i stedet for å hardkode `60m_celler` som spesialtilfelle.

Test begge: logg et trenings-100m (skal IKKE bli PB) og et stevne-100m (skal kunne bli PB);
logg et trenings-60m_celler (SKAL kunne bli PB).

**Ellers:** ikke lag om selve PB-*loggingen* (inntasting av løp i `sprint_log`) — bare
hvilke distanser som finnes (#5) og hvordan PB *velges* (regelen over).

---

## Oppgave #6 — rydd strø-filer i rot

Disse ser ut som etterlatte test-/duplikatfiler (IKKE i den offisielle fil-lista i
`CLAUDE.md`):
- `2026-06-11-test-loadpain.html` (~316 kB) — tydelig en gammel test-kopi.
- `kalender-widget.html` (~7 kB) og `treningsdagbok.html` (~28 kB) — **usikre**; kan være
  i bruk (f.eks. en innebygd widget eller en eldre side).

**Gjør:**
1. Verifiser at filene ikke refereres noe sted før du foreslår sletting:
   ```bash
   grep -rn "test-loadpain\|kalender-widget\|treningsdagbok" --include=*.html --include=*.js --include=*.json .
   ```
   Sjekk også `vercel.json`/evt. routing og om noen `<a href>` peker dit.
2. **Ikke slett noe på egen hånd.** List opp hver fil med (a) størrelse, (b) om den
   refereres noe sted, (c) din anbefaling (slett / behold), og be Filip bekrefte før
   sletting. `2026-06-11-test-loadpain.html` er nesten helt sikkert trygg å fjerne, men
   bekreft uansett.

---

## Til slutt
List alle filer du opprettet/endret med plassering. Kjør `node --check` på endret JS og
nøkkelparitet-sjekken over. Test begge språk i nettleseren.
