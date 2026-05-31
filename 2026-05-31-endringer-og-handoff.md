# Dashboard — endringslogg 31. mai 2026 + handoff til neste AI

## Til neste AI-assistent (les dette først)

Filip eier dette personlige helse-/treningsdashboardet (vanilla HTML/CSS/JS, Vercel, Supabase).
Viktig kontekst du må kjenne til:

- **USA høst 2026:** Filip flytter til USA på utveksling i ett år. Dashboardet skal med.
  Derfor er **engelsk språkbytte (🇺🇸-knappen øverst til venstre)** kritisk — hele appen skal
  kunne kjøre på engelsk. i18n-systemet ligger i `utils.js` (`TRANSLATIONS.no` / `.en`,
  funksjonen `t()`, og `data-i18n*`-attributter som `applyLang()` setter).
- **Soccer/basketball:** I USA trener Filip fotball (soccer) og kanskje basketball ved siden
  av sprint/styrke. Disse logges i `activity_log` (activity_type "Soccer"/"Basketball" osv.)
  via Treningsoversikt. AI-en (`api/ai-chat.js`) har fått kontekst om dette.
- **Patellar tendinopati venstre kne:** kjernekonteksten for all rådgivning. Uendret.
- **Budsjett:** AI-chat skal IKKE koste mer enn $5/mnd. `max_tokens` står bevisst på 2000.
  Ikke øk den. Token-bruk ble redusert ved å sende kompakt JSON (ikke pretty-print).
- **AI-chat språk:** AI-svar er ikke i18n — AI-en svarer på engelsk når Filip skriver engelsk
  (instruert i system-prompten). Det er bevisst.

### To SQL-migrasjoner må kjøres i Supabase SQL Editor (ELLERS virker ikke alt):
1. `2026-05-30-activity-log-migration.sql` — activity_log (hvis ikke alt kjørt)
2. `2026-05-31-active-session-sync.sql` — NY: active_session-tabell for økt-sync på tvers av enheter

---

## Hva ble gjort 31. mai 2026

### Bug-fikser
- **login.html:** fikset race condition (knapp kunne kalle uinitialisert `db`). Bruker nå
  `getConfig()` + guard `if (!db)`.
- **gym.html saveLog:** rekkefølge endret — `gym_log` insertes først og sjekkes, så `knee_pain`.
  Unngår foreldreløse knesmerte-rader hvis gym-insert feiler.
- **gym.html timer:** `clearInterval(elapsedTimer)` før ny `setInterval` i `startWorkout` —
  hindrer dobbel timer ved gjenopptatt økt.
- **api/ai-chat.js:** guard mot tomt AI-svar (`data.content?.[0]?.text || 'Tomt svar fra AI.'`).
- **kalender.html:** `loadDailyStats` spurte feil tabell `sleep_log` → rettet til `health_data`.
  Søvn-statistikken i kalenderen var alltid tom før dette.
- **api/garmin-sync.py:** rettet motstridende kommentar om søvn-dato (koden var riktig).
- **sovn.html:** feil oversettelsesnøkkel for lav søvnscore (`hrv_low` → `score_bad`).
- **gjoremal.html:** error-håndtering på toggle/slett var allerede lagt til; toast-tekster i18n-et.

### Nye funksjoner
- **AI-chat cross-device sync:** lastet allerede fra Supabase; fikset at `.limit(20)` hentet
  ELDSTE i stedet for nyeste meldinger (nå `ascending:false` + reverse). Chat følger nå med
  mellom PC og telefon.
- **Aktiv treningsøkt sync (gym):** ny `active_session`-tabell speiler økt-tilstanden til Supabase
  (debounced). Start økt på PC → fortsett/avslutt på telefon. Lokal localStorage beholdt som
  rask sti; sky brukes hvis nyere. (Sprint har bare et form-utkast, ikke synket — lav verdi.)
- **AI-context:** trekker nå inn `activity_log` (gjorde det allerede), + system-prompt forklarer
  USA/soccer/basket og "Rolig dag". Kompakt JSON sparer tokens.
- **Søvn — Våken-tid:** lagt til i søvn-chartet (stablet søyle + legende) og finnes allerede i
  arkitektur-kortet (vises når `awake_minutes` har data).
- **Kalender søvn-format:** "8.61t" → "8t 37m" (ny `fmtSleepHM`).
- **Rolig dag-logg (Treningsoversikt):** ny aktivitetstype "Rolig dag" + "Basketball". Når du
  velger "Rolig dag" auto-fylles feltet "Erstattet planlagt økt" med dagens planlagte økt, og du
  kan skrive årsak (f.eks. "Sprint — hamstring"). Lagres i `activity_label`. AI forstår det.
- **Forside — legg til viktig gjøremål:** input nederst i Gjøremål-kortet på dashboard. Legger
  todo i lista "Generelt" med important=true.
- **Dagens fokus:** håndterer nå Rehab / Sprint / Soccer / Styrke som egne kategorier med egne
  fokuspunkter og badges (før falt alt ikke-sprint/hvile til "styrke").

### i18n (engelsk-bytte) — stor jobb
- La til `data-i18n-html`-støtte i `applyLang()` (for strenger med `<br>`).
- Migrerte ~150+ hardkodede norske strenger på alle sider til `t()`/`data-i18n`.
- Verifisert programmatisk: **0 manglende nøkler**, og **EN-blokken har alle nøkler NO har**
  (ingenting faller tilbake til norsk når engelsk velges).
- Aktivitets-knapper beholder norsk `data-type` (DB-verdi) men viser oversatt etikett.
  MERK: historikk som viser `activity_type` direkte fra DB vil fortsatt vise lagret verdi
  (f.eks. "Fotball") uansett språk — en framtidig forbedring er en `actTypeLabel()`-mapping
  ved rendering. Ikke gjort ennå.

### Opprydding
- favicon.png komprimert 902 KB → 47 KB (1254² → 256², samme bilde).
- Slettet søppelfiler: `treningsplan.html.bak`, `treningsplan.html.patch`,
  `2026-05-22-dashboard-prompt-kopi.md`, tom `!CLICK_ME.md`.

### Verifisert
- Alle 9 siders inline-JS + utils.js + alle API-filer + garmin-sync.py: syntaks OK.
- `<script>`-tagger balansert på alle sider. Alle sider laster utils.js.
- 0 udefinerte i18n-nøkler.

---

## Gjenstående / forslag (ikke gjort)
- **Sprint-utkast sync** på tvers av enheter (lav verdi — sjelden behov).
- **`actTypeLabel()`-mapping** så lagrede aktivitetstyper i historikk vises oversatt.
- **USA-tilpasninger å vurdere:** tidssone-håndtering (Garmin-cron kjører 05:45 UTC = annen
  klokkeslett i USA — sjekk at søvn synkes til rett dato), evt. miles/lbs-visning, og en
  "competition/meet"-deteksjon tilpasset amerikanske stevner.
- **vercel.json rewrites** dekker ikke alle nye stier hvis du legger til sider.
