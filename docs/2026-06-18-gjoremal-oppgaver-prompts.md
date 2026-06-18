# Gjøremål → Claude Code-prompts (2026-06-18)

Seks gjøremål omgjort til kjørbare prompts. Les **Mentor-flagg** nederst FØR du kjører —
to av punktene er ikke det du tror de er.

**Navnefiks:** Det finnes ingen `treningsoversikt.html`. Det du kaller «Treningsoversikt»
er **`treningsplan.html`** (eier øktlogg, økthistorikk, trender, aktivitetslogging,
ukeslast). Alle prompter under bruker det faktiske filnavnet.

**Rekkefølge (lavest risiko først):** P6 (lister) → P1 (diagnose) → P4 (trend) →
P5 (navigasjon) → P3 (multiplikator). P3 sist fordi den rører belastnings­modellen.

---

## Felles regler — lim inn ØVERST i hver prompt

```
KONTEKST OG REGLER (gjelder hele oppgaven):
- TOSPRÅKLIG (se CLAUDE.md): ALL synlig tekst via data-i18n / t(). Nye nøkler i BÅDE
  TRANSLATIONS.no OG .en i utils.js — like mange nøkler. Aldri hardkod norsk/engelsk.
- Dynamisk JS-tekst må re-rendres i sidens onLangChange. Test BEGGE språk i nettleser.
- Kilde-til-sannhet for skader er `injuries`-tabellen. ALDRI hardkod en kroppsdel.
  «Alvorlig behandlet» = severity='severe' OG status in ('active','improving').
- Endringer skal være ADDITIVE og reversible. Ikke slett kolonner/tabeller nå.
- Inspiser FAKTISK skjema/kode før du endrer — ikke anta kolonnenavn eller funksjoner.
- FØR FERDIG: `node --check` på endret JS + nøkkel-paritet (no==en, kommando i CLAUDE.md)
  + test begge språk. STOPP og rapporter hvis et STOPP-kriterium brytes.
```

---

## P1 — «Kopier diagnose» per skade, ikke kne-aggregat  ⭐

```
FIL: ai.html, funksjonen copyInjuryStatus() (ca. linje 985).

VERIFISER FØRST (ikke stol på antakelsen): funksjonen looper allerede injuries
generisk (linje ~1018-1026) og leser injury_pain. Den FAKTISKE svakheten er at smerte
rapporteres som ÉN samlet maks-verdi på tvers av alle skader (linje ~1034-1038,
diag.last7), pluss en legacy-lesning av knee_pain. Kopier dagens output for kne+hamstring
og bekreft hva som faktisk mangler før du endrer.

OPPGAVE: Vis nylig smerte PER skade, ikke ett globalt maks-tall.
- For hver listet skade: hent siste 7 dagers smerte fra injury_pain filtrert på injury_id
  (maks eller siste før/under/etter/d.etter), og vis den under skadens egen linje.
- Behold legacy knee_pain KUN som fallback for kne hvis injury_pain mangler for kneet.
- diag.last7-linja beholdes for økter/snitt-RPE, men «maks smerte»-delen erstattes av
  per-skade-visningen over (eller fjernes derfra).
- Tospråklig: nye nøkler (f.eks. diag.pain_line) i no+en.

STOPP: en alvorlig skade (f.eks. hamstring) mangler smerte i kopien; kne mister data;
node --check feiler; no/en ulikt antall nøkler.
LEVER: kopiert tekst for et tilfelle med BÅDE kne og hamstring, på begge språk.
```

---

## P3 — Velgbar belastnings-multiplikator ved aktivitetslogging  ⚠️ AVKLAR FØRST

```
FIL: treningsplan.html. «Logg aktivitet»-modal (saveActivity ~2381, actDuration ~618).
Ukeslast beregnes som Σ (RPE/10 × aktivitetsmultiplikator) — multiplikatoren er i dag
HARDKODET per activity_type (linje ~1442-1594), varighet teller ikke, og
fotball/basket gir 0 belastning (linje ~1594).

AVKLAR FØR KODING (svar i prompten din):
  a) Skal valgt multiplikator OVERSTYRE type-defaulten, eller legges til som egen vekt?
  b) Default = dagens type-verdi (forhåndsutfylt), brukeren kan justere? (anbefalt)
  c) Belastning skal fortsatt være varighets-uavhengig (RPE × mult), ikke RPE × min? (anbefalt: ja)

OPPGAVE (gitt anbefalt design):
- Migrasjon (additiv, idempotent): legg til activity_log.load_multiplier numeric.
  Inspiser eksisterende migrasjoner + RLS-mønster først; backfill eksisterende rader
  med type-defaulten så historikk er uendret.
- I logg-modalen: felt/slider for multiplikator, forhåndsutfylt med type-defaulten,
  overstyrbar. Lagre på activity_log.
- Ukeslast-beregningen (~1442-1594) bruker rad-multiplikatoren når satt, ellers
  type-defaulten. Dette lar fotball/basket faktisk telle.
- Tospråklig label + hjelpetekst i no+en.

STOPP: gammel ukeslast endrer seg for eksisterende økter (backfill feil); node --check
feiler; nøkkel-paritet brutt.
LEVER: skjermbilde av modal + før/etter ukeslast der en fotballøkt nå bidrar.
```

---

## P4 — Generaliser trend-teksten «Knesmerte forbedres»

```
FIL: utils.js (tp.trend_up/down/stable) + treningsplan.html (trendFromDelta ~1353-1355,
trendBody ~553).

PROBLEM: tp.trend_up = '↓ Knesmerte forbedres' hardkoder «Knesmerte». For en
hamstring-trend står det feilaktig «Knesmerte». (Ditt notat «den kan fjernes helt» tolkes
som: fjern den kne-spesifikke ordlyden — IKKE slett trend-funksjonen. Bekreft om du heller
vil fjerne hele trend-widgeten.)

OPPGAVE:
- Endre tp.trend_up/down/stable i no+en til skade-nøytral ordlyd
  («↓ Smerte forbedres» / «↓ Pain improving» osv.), ELLER injiser skadenavnet via t().
- Verifiser at trendFromDelta og trendBody beregnes PER alvorlig skade (P4-generalisering).
  Hvis trenden fortsatt kun regnes for kne, generaliser den til én trend per skade.

STOPP: trenden navngir feil kroppsdel; kne-trenden forsvinner; node --check feiler;
nøkkel-paritet brutt.
LEVER: skjermbilde av trend for kne OG hamstring, begge språk.
```

---

## P5 — Naviger økthistorikk med mange økter

```
FIL: treningsplan.html. Øktlogg/økthistorikk (sessionGrid ~498, lasting ~1363 limit 30).
PROBLEM: når mange økter hopes opp blir lista uoversiktlig.

AVKLAR (velg én — anbefalt i parentes):
  a) Gruppér per uke/måned med sammenleggbare seksjoner (anbefalt)
  b) Søk/filter (type, dato, smerte>0)
  c) Paginering / «last flere» / lazy-load
  → Anbefalt kombo: gruppér per uke (nyeste åpen, resten kollapset) + enkelt typefilter.

OPPGAVE (anbefalt kombo):
- Gruppér økthistorikken per ISO-uke med kollapsbare headere (uke + dato-range + antall).
  Inneværende uke åpen, eldre kollapset. Bruk fmtLocale() for datoer (ikke hardkod måneder).
- Et lett filter (alle / styrke / sprint / aktivitet). Behold klikk-for-detalj-drawer.
- Tospråklig, onLangChange re-rendrer grupper + filter-labels.

STOPP: en økt forsvinner ut av lista; drawer slutter å virke; tekst lekker på feil språk;
node --check feiler.
LEVER: skjermbilde med flere uke-grupper, en kollapset og en åpen, begge språk.
```

---

## P6 — Dra og endre rekkefølge på gjøremålslister

```
FIL: gjoremal.html. NB: oppgaver INNAD i en liste kan allerede dras (.drag-handle,
.todo-item.dragging/.drag-before/.drag-after, ~423-444). Det som mangler er å dra selve
LISTENE i sidefeltet (#listsBar, ~657).

OPPGAVE:
- Inspiser liste-tabellen i Supabase. Mangler den en posisjons-kolonne, lag additiv,
  idempotent migrasjon (f.eks. position int) + backfill nåværende rekkefølge.
- Gjør listene i #listsBar dragbare og gjenbruk EKSISTERENDE drag-mønster fra todo-items
  (samme klasser/håndtering) — ikke finn opp et nytt.
- Lagre ny rekkefølge til posisjons-kolonnen ved slipp; rekkefølgen skal overleve reload.
- Tospråklig der relevant (aria/title via data-i18n).

STOPP: rekkefølge nullstilles ved reload; item-drag inni lister brekker; node --check feiler.
LEVER: kort klipp/skjermbilder: dra en liste, reload, rekkefølge bevart.
```

---

## Ikke en prompt: P2 — «Hva er manuell registrering på gym siden»

Dette er et spørsmål, ikke en oppgave. Svar: **«Manuell registrering»**
(`gym.html`, `pain.manual_entry`, ~683 + skjema ~2567-2616) er **tilbakedatert
smerteregistrering**. Per alvorlig skade får du et lite skjema med datovelger +
før/under/etter/dagen-etter (0–10) + notat, som skrives til `injury_pain` med
`source='manual'`. Poenget: fylle inn smerte for dager du **ikke** trente — f.eks.
backfille forrige ukes hamstring-smerte fra hukommelsen så grafen ikke har hull.

Ingen kodeendring nødvendig. Hvis selve **navnet** forvirret deg (det gjorde det jo),
er den eneste reelle oppgaven å gjøre etiketten tydeligere:

```
FIL: gym.html + utils.js. Etiketten pain.manual_entry («Manuell registrering») er
uklar. Endre til noe selvforklarende i no+en, f.eks. «Etterregistrer smerte (tilbakedatert)»
/ «Log past pain (backdated)», og legg en kort data-i18n-title som forklarer at det fyller
hull på dager uten økt. Ingen logikkendring. node --check + nøkkel-paritet.
```

---

## Mentor-flagg

- **P1 antar feil.** Funksjonen er allerede stort sett generisk — den hardkoder ikke
  kneet slik du skrev. Den ekte mangelen er per-skade smerte vs. ett aggregat. Få Claude
  til å verifisere faktisk kopiert output før den rører koden, ellers «fikser» den noe som
  ikke er problemet.
- **P2 er ikke en oppgave.** Det var et spørsmål til deg selv. Nå besvart. Ikke bruk en
  Claude-kjøring på det med mindre du vil ha navnefiksen.
- **P3 og P5 er underspesifiserte.** Begge har en «AVKLAR FØRST»-blokk. Hvis du hopper
  over den, gjetter Claude på designet og du får noe du må gjøre om. Ta beslutningen først.
- **P3 rører belastnings­modellen.** Feil backfill endrer historisk ukeslast og ACWR
  stille. Kjør den sist og verifiser før/etter-tall.
- **Én commit per prompt.** Som i skade-generaliserings-dokumentet: aldri flere punkter
  i samme commit.
```
