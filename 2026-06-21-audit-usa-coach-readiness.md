# Dashboard-revisjon — coach/physio-klar for USA (read-only)

**Dato:** 2026-06-21 · **Omfang:** alle `.html`, `utils.js`, `api/`, `supabase/migrations/`
**Kontekst:** Filip, 17, sprinter (100/200m) + styrke, patellar tendinopati v. kne, ~6 økter/uke, til USA høst 2026. Dashbordet vises til amerikanske trenere/fysioterapeuter.

> **Ingen endringer gjort.** Dette er kun en gjennomgang.

---

## Først: hva som allerede er bra (så vi ikke "fikser" det som funker)

Appen er moden. Mye av det en revisjon vanligvis flagger er allerede på plass:

- **Skadesporing er sterk.** `injuries` (kroppsdel, side, alvorlighet, status, startdato) + `injury_pain` (før/under/etter/dagen-etter, 0–10, per skade per økt) + `physio_notes` (terapeut + notat). Smertetrend over tid kan følges av en fysio.
- **Belastning beregnes seriøst.** `acwr.js` gjør EWMA acute:chronic workload ratio, brukt på dashboard og i AI-konteksten. sRPE (min × RPE) summeres på tvers av gym, sprint og andre aktiviteter.
- **Soccer/basket ER synlig.** `activity_log` dekker fotball, basket, svømming, sykling, padel, am. fotball med varighet, RPE og knescore. Aktivitetene mates inn i belastning og AI-kontekst.
- **PDF-dagboken (`treningsdagbok.html`) er reell coach-handoff.** Tospråklig, med identitet (navn, født 2009, 187 cm/70 kg — også 6′2″/154 lbs på engelsk), skadeoversikt, smertetrend (sparkline), ukentlig belastning (søyler) og kronologisk øktlogg.
- **i18n-disiplinen er nesten vanntett.** 941 nøkler i BÅDE no og en (perfekt paritet), kun to reelle lekkasjer funnet (se under).
- **Vektenhet kg↔lbs finnes** og defaulter til lbs på engelsk.
- **Auto-progresjon med smertetak** (`overload_config`: rep-intervall, steg, `pain_limit`, RIR) — fysio-vennlig logikk.

Konklusjonen under handler derfor om de få tingene som faktisk vil skurre når en amerikansk trener ser dette dag én.

---

## HØY IMPAKT

### H1 — Datoformat er britisk (DD/MM), ikke amerikansk (MM/DD)
**Fil:** `utils.js` (`fmtLocale()` → `en-GB`), samme mønster i `treningsdagbok.html`, `ai.html`, `kalender-widget.html`.
Hele appen bruker `en-GB` for engelsk → **07/06/2026 betyr 6. juli for en amerikaner, men appen mener 7. juni.** En US-trener leser hver dato feil. Dette er den klareste USA-bommen i hele appen, og den er gjennomgående. Bør være `en-US` (eller ISO `YYYY-MM-DD`, som er entydig) når språket er engelsk.
**Hvorfor det betyr noe:** all troverdighet i loggen avhenger av at trener leser datoene riktig. Én linje (`fmtLocale`) påvirker det meste.

### H2 — Sprintlogg mangler vind og tidtakingsmetode (og splitter/reaksjonstid)
**Fil:** `sprint.html` (loggskjema: distanse, type, akselerasjonsnivå, tid). DB: `sprint_log`.
En 100/200m-tid er ikke tolkbar uten **vind** og **hånd vs. el. tid (FAT)**. +2.0 vs −2.0 m/s ≈ 0.2 s på 100m; håndtid er typisk ~0.24 s raskere enn FAT. En amerikansk sprinttrener vil instinktivt spørre om begge, og en "11.10" uten kontekst ser enten oppblåst eller usikker ut. Mangler også **reaksjonstid** og **mellomtider/flying splits** (f.eks. 30m fly, 0–30 akselerasjon) som US-trenere bruker til å skille start- vs. toppfart-problemer.
**Hvorfor det betyr noe:** dette er feltene som avgjør om en ny trener stoler på tallene og kan coache spesifikt. Vind + tidtakingsmetode er minimum.

### H3 — PDF-dagboken viser ingen styrketall
**Fil:** `treningsdagbok.html` (render henter `gym` kun som type + varighet + RPE; `set_log`/`exercise_weights` er ikke med).
Styrkeøkter vises som "Strength · 60 min · RPE 65" — **ingen knebøy, frivend, hinkøvelser eller nøkkeltall.** En amerikansk styrketrener får ingenting handlingsbart. Dataene finnes (`set_log` per sett med vekt/reps, `exercise_weights`), de surfaces bare ikke i dokumentet.
**Hvorfor det betyr noe:** halve treningen hans (styrke) er usynlig i selve dokumentet han skal rekruttere/overlevere med. Et lite "topp-løft / nøkkeløvelser denne perioden"-avsnitt ville løftet PDF-en mye.

---

## MEDIUM

### M1 — RPE-skala 1–100 er uvanlig for US-trenere
**Fil:** hele logg-stacken (`sprint_log`, `gym_log`, `activity_log` migrert til 1–100), vises i PDF.
Amerikanske trenere bruker RPE 1–10 (eller RIR). "Avg RPE 65" leses som rart/feil. PDF har en liten legende, men vurder å vise /10 eller tydelig merke skalaen der trenere ser den.
**Hvorfor:** unngår at trener feiltolker intensitet eller stoler mindre på loggen.

### M2 — i18n-lekkasje i kalender-widget (norsk i engelsk modus)
**Fil:** `kalender-widget.html` (linje ~193, ~205: `toLocaleDateString('nb-NO')`/`toLocaleTimeString('nb-NO')` hardkodet uansett språk).
Widgeten viser norske dato-/tidsnavn selv på engelsk. Synlig overflate.

### M3 — Hardkodet norsk placeholder på dashboard
**Fil:** `dashboard.html` linje 476: `placeholder="Legg til gjøremål…"` uten `data-i18n-placeholder`.
Eneste reelle tekstlekkasje i hovedsidene — vises som norsk i engelsk modus.

### M4 — Ingen kroppsvekt-/utviklingstrend
**Fil:** —(finnes ikke). Kun statisk 70 kg i profil/PDF.
17 år og i vekst: power-to-weight og vektutvikling er noe både sprinttrener og fysio (senebelastning ved patellar tendinopati skalerer med kroppsvekt) følger. En enkel ukentlig vektlogg ville gitt en relevant trend.

### M5 — Ingen søvn/beredskap → prestasjon-kobling
**Fil:** `sovn.html` har readiness-score, men ingen visning som kobler søvn/belastning mot sprinttider.
Trenere elsker "er han uthvilt nok til å sette PB". Dataene finnes (søvn, HRV, RHR, ACWR, sprinttid) — koblingen mangler.

---

## NICE TO HAVE

### N1 — Hurtiglogg / én-tap for dagens planlagte økt
**Fil:** `dashboard.html` (ingen quick-log-snarvei funnet).
Logging krever navigering til riktig side + utfylling. På travle skoledager i USA er dette det som realistisk droppes. En "logg dagens økt"-knapp fra dashboard med forhåndsutfylt type ville redusere friksjon.

### N2 — 12-timers klokke (AM/PM) for engelsk
**Fil:** tidsformatering via `en-GB` gir 24t. US bruker 12t AM/PM. Mindre, men merkbart for trenere.

### N3 — Stevne-/PR-visning for rekruttering
**Fil:** `sprint.html` har type "Stevne", men ingen dedikert konkurranse-/resultatvisning (plass, runde, heat, offisiell tid).
For college-rekruttering i USA er en ren "competition results / season bests"-visning gull verdt.

### N4 — Sport-spesifikk detalj for ball-idrett
**Fil:** `treningsplan.html` (activity_log).
Fotball/basket logges som type + varighet + RPE. For kne-belastning kunne minutter spilt vs. trent / retningsendringsvolum vært nyttig — men lav prioritet.

### N5 — Verifiser at andre aktiviteter teller i ACWR (ikke bare rehab-streak)
**Fil:** `treningsplan.html` linje ~1961 ekskluderer fotball/basket fra *rehab-streak* (riktig). Bekreftet at de mates inn i belastning/AI-kontekst — men verdt en rask test at de også slår inn i ACWR-serien, ikke bare i AI-prompten.

---

## Oppsummert prioritering

| # | Sak | Fil | Hvorfor |
|---|-----|-----|---------|
| H1 | Datoformat en-GB → en-US | `utils.js` m.fl. | US-trenere leser alle datoer feil |
| H2 | Vind + tidtakingsmetode (+ splits/RT) i sprintlogg | `sprint.html` | Sprinttider er ikke tolkbare/troverdige uten |
| H3 | Styrketall mangler i PDF | `treningsdagbok.html` | Halve treningen usynlig for styrketrener |
| M1 | RPE 1–100 uvanlig | logg-stack/PDF | Feiltolkes av US-trenere |
| M2 | nb-NO hardkodet i kalender-widget | `kalender-widget.html` | Norsk lekker i engelsk modus |
| M3 | Norsk placeholder | `dashboard.html:476` | Tekstlekkasje |
| M4 | Ingen vekttrend | — | Power-to-weight + senebelastning |
| M5 | Ingen søvn→prestasjon-kobling | `sovn.html` | Beredskap vs. PB |
| N1 | Hurtiglogg | `dashboard.html` | Reduserer droppet logging |
| N2 | 12t AM/PM | tidsformat | Lesbarhet US |
| N3 | Stevne-/PR-visning | `sprint.html` | College-rekruttering |
| N4 | Ball-sport detalj | `treningsplan.html` | Kne-belastningsinnsikt |
| N5 | Verifiser aktivitet i ACWR | `treningsplan.html` | Korrekt total belastning |
