# Implementeringsprompt — delt smerte-måler + gym-forbedringer

Kopier alt under streken inn i en ny økt i denne mappa (`/Users/09fillun/Dev/Dashboard`).
Les `CLAUDE.md` (rot + global) først — RLS, tospråklighet og «bekreft før sletting» gjelder hele veien.

---

## Mål

Tre endringer. Den store er **#1** og berører hele dashboardet.

1. **Ny smerte-input «måler» (0–10), delt komponent, brukt OVERALT.**
   Erstatter dagens to varianter: `mini-pain-btn`-rutenett (gym, sprint) og
   `<input type="number" min=0 max=10>` (treningsplan, dashboard m.fl.).
2. **Manuell smerteregistrering på gym → popup-modal** (brukes sjelden, skal vekk fra sidepanelet).
3. **✎ i gym-økthistorikk → full inline-editor** (RIR + hvilke øvelser/sett som ble gjort + smerte).

Datamodellen er UENDRET: fortsatt heltall 0–10 lagret i `before_score / during_score /
after_score / day_after_score` (`injury_pain`, legacy `knee_pain`) og i `treningsplan`/
`dashboard` sine eksisterende felt. Ingen nye tabeller → RLS uberørt. Verifiser likevel
RLS-sjekken i `CLAUDE.md` til slutt (ingen `CREATE TABLE`, så den skal være uendret).

---

## Oppgave 1 — Delt smerte-måler (størst, gjør denne først)

### 1a. Lag komponenten i `utils.js` (ved siden av `rpeSliderHTML` / `painColor`)

Speil mønsteret til `rpeSliderHTML`/`rpeValue` (touched-flagg for «ikke logget» = `null`):

```js
// 0–10 smerte-måler. Ett trykk setter verdi; fyller 0..v og farges av painColor(v).
// value = startverdi (null/'' = ikke logget). Les med painMeterValue(id) → tall|null.
function painMeterHTML(id, value = null, opts = {}) { ... }   // returnerer HTML
function painMeterSet(id, v) { ... }                          // onclick-handler per segment
function painMeterValue(id) { ... }                           // tall, eller null hvis aldri rørt
```

Krav til komponenten:
- 11 trykkbare segmenter (0–10) på én rad som kan brytes; ett trykk = ferdig (ingen drag-krav).
- Valgt verdi + alle under fylles i `painColor(v)`; resten nøytral grå. Tallet vises til høyre.
- «Ikke logget» = `null`: ingen segmenter fylt, tall viser `–`. Første trykk setter `touched`.
- Tilstand lagres i DOM (f.eks. `data-v` + `data-touched` på en wrapper), ikke i globale objekter,
  så flere målere kan leve samtidig (historikk-editor har mange).
- Tilgjengelighet: wrapper `role="group"` + `aria-label`; segmenter er `<button>` med `aria-label`.
- CSS legges i `styles.css` (delt), ikke per side. Bruk eksisterende fargevariabler.

### 1b. i18n
Ingen synlig fast tekst i selve måleren (bare tall). Hvis du legger til label/aria-tekst,
legg nøkkelen i BÅDE `TRANSLATIONS.no` og `.en` i `utils.js` (lik nøkkeltelling — kjør
sjekken i `CLAUDE.md`). Fasenavn (Før/Under/Etter/Dagen etter) finnes alt: `knee.before`,
`knee.during`, `knee.after`, `knee.dayafter` / `tp.knee_dayafter`.

### 1c. Bytt ut ALLE forekomster

Finn alt med:
```
grep -rn "mini-pain-btn\|Array(11)\|type=\"number\"[^>]*max=\"10\"" *.html
```

Kjente steder som MÅ konverteres til `painMeterHTML` / `painMeterValue`:

- **gym.html**
  - Live-smerte-verktøy i sidepanelet (`#sbKneeButtons`, `selectSbPain`, `setSbPhase` ~l.2526–2540).
    Behold fase-pillene (Før/Under/Etter/D.etter); bare 0–10-raden blir måler.
  - «Før økt»-blokkene (`#injuryBeforeBlocks`, renderes per skade ~l.2650). **Dette er bildet
    Filip mener er rotete** — størst gevinst her.
  - Dagen-etter-banner (`#dayAfterPainBtns`, `mkRow` ~l.3577).
  - Manuell registrering (`gmp-*`, ~l.2776) — flyttes også til modal i oppgave 2.
  - Historikk-editor (`painEditHtml`, ~l.3054) — utvides i oppgave 3.
- **sprint.html** — to rutenett (~l.378, ~l.456).
- **treningsplan.html** — `<input type=number 0-10>` i øktredigering (~l.1555) og `act-pain-row`
  (~l.2598). Bytt til måler; les med `painMeterValue`.
- **dashboard.html** — eventuelle 0–10-input (smerte/kne). Konverter input, behold ren visning.
- **treningsdagbok.html / ai.html** — sjekk: bytt KUN faktiske 0–10-input. Ren lese-visning
  av smerte (f.eks. AI-kontekst) skal IKKE bli interaktiv måler.

Behold lese-/visnings-fargekoding via `painColor()` der den alt finnes.

### 1d. Nye dager / nye skader
Disse rendres gjennom de samme funksjonene (`renderInjuryBefore`, `renderGymManualPainForms`,
`weekly_plan`-flyten). Verifiser at oppretting av ny skade og ny dag automatisk viser måleren —
ikke hardkod per eksisterende skade.

### 1e. Re-render ved språkbytte
Hver side har `onLangChange`. Hvis måleren har tekst, sørg for at den re-rendres der dynamisk
innhold bygges i JS (jf. `CLAUDE.md`-regelen).

---

## Oppgave 2 — Manuell registrering → popup-modal (kun gym.html)

- Fjern sidepanel-seksjonen `#gymManualPainSec` fra fast visning.
- Legg en liten knapp (f.eks. `+ Manuell` / `+ Manual`, tospråklig) et diskret sted i
  sidepanelet (nær økthistorikk-headeren).
- Knappen åpner en modal i samme stil som «Ny dag»-dialogen (`#dayDialog` /
  `.day-dialog-backdrop` / `.day-dialog`). Flytt `renderGymManualPainForms()`-innholdet
  inn i modalen uendret (nå med måler fra oppgave 1). Lukk-knapp + klikk på backdrop lukker.
- `saveGymManualPain()` skal fungere som før (insert til `injury_pain`, `source:'manual'`),
  og lukke modalen ved suksess.
- Skjul fortsatt manuell-knappen når en økt er aktiv (`workoutState === 'active'`), slik
  dagens logikk gjør.

---

## Oppgave 3 — ✎ gym-økthistorikk → full inline-editor

Kort-redesignet i historikken er ALT gjort (ikke rør layouten). Utvid kun rediger-skuffen
(`painEditHtml` / `#knee-edit-${g.id}`, `toggleKneeEdit`).

I dag redigerer skuffen bare smerte. Den skal i tillegg redigere:

1. **RIR** — bruk delt `rirSliderHTML(id, rpe)` + `rirValue(id)`. Lagre tilbake til
   `gym_log.rpe` (mappingen RPE = 100 − RIR×10 er allerede i `rirValue`).
2. **Øvelser + sett** — last `set_log` for `g.date` (allerede hentet som `setMap[g.date]`
   i `loadGymHistory`; bruk samme kilde eller hent på nytt ved åpning). Vis redigerbare rader
   per øvelse: vekt (`weight_kg`, vis i brukerens enhet via `fromKg`/`weightUnit`/`toKg`),
   reps, og mulighet til å fjerne et sett og legge til et sett. «Hvilke øvelser jeg har gjort»
   = kunne fjerne/legge til øvelse-rader. Lagre diff til `set_log` (update endrede, delete
   fjernede, insert nye). Behold `set_index`-rekkefølge.
3. **Smerte** — som i dag, men via måleren fra oppgave 1 (per skade: før/under/etter/dagen).

- Én «Lagre»-knapp i skuffen som committer alt (RIR + sett + smerte) i en `Promise.all`,
  så `toast` + `loadGymHistory()`. Behold «Lukk».
- All ny synlig tekst tospråklig (`t()` + nøkler i begge språk).
- Pass på at sett-skriving matcher hvordan `saveLog()` skriver `set_log` i dag (samme felt/format)
  — finn og gjenbruk den logikken for å unngå drift.

---

## Verifisering før du sier deg ferdig

- `node --check utils.js` (og evt. ekstrahér inline-script for andre filer).
- i18n-nøkkeltelling no == en (kommandoen i `CLAUDE.md`).
- Test BEGGE språk i nettleser (🇳🇴/🇺🇸) — let etter lekkende tekst begge veier.
- Test måleren på hvert sted: før økt, live-smerte, dagen-etter, manuell (modal), historikk-editor,
  sprint, treningsplan, dashboard. Verdi 0 må kunne logges (≠ «ikke logget»).
- Opprett en ny skade og en ny dag → måler vises automatisk.
- Historikk-editor: endre RIR + et sett + en smerte, lagre, last på nytt → alt persistert.
- RLS-sjekken i `CLAUDE.md` (skal være uendret — ingen nye tabeller).
- List alle endrede filer til slutt.

## Rekkefølge
1 (måler + utrulling) → 2 (modal) → 3 (editor). Vis resultat underveis.
