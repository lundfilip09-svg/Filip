# Skade-generalisering — Claude Code-prompts

**Mål:** En skade med alvorlighet `severe` (Alvorlig) skal få NØYAKTIG samme behandling
i hele dashboardet som kneet har i dag — uten hardkoding, slik at framtidige skader
"bare funker" når de markeres Alvorlig.

**Kilde-til-sannhet:** `injuries`-tabellen (body_part, side, status, severity).
Den finnes allerede, men mater i dag kun AI-prompten. Alt visuelt skal lese fra den.

---

## Felles regler (lim inn øverst i HVER prompt)

```
KONTEKST OG REGLER (gjelder hele denne oppgaven):
- Kilde-til-sannhet for skader er `injuries`-tabellen. ALDRI hardkod en kroppsdel.
- "Alvorlig behandling" = severity='severe' OG status IN ('active','improving').
  status='archived' → vises ikke. severity 'mild'/'moderate' → kun AI-kontekst, ikke UI.
- Kneet er IKKE et spesialtilfelle. Det er bare injury-rad #1 og må rendres av samme
  generiske kode som alle andre. Hvis kneet slutter å virke, er løsningen feil.
- Endringer skal være ADDITIVE og reversible. Ikke slett gamle kolonner/tabeller i denne
  omgangen (egen oppryddings-prompt P6 til slutt).
- DOBBELTSKRIVING under migrering: kne-smerte skrives både til ny `injury_pain` OG til
  gamle `knee_*`-kolonner, så ikke-migrerte lesere fortsatt virker. Dette lar hvert punkt
  gjøres uavhengig.
- TOSPRÅKLIG (se CLAUDE.md): all synlig tekst via data-i18n / t(). Nye nøkler i BÅDE
  TRANSLATIONS.no og .en i utils.js. Kroppsdel-navn skal også finnes på begge språk.
- FØR DU SIER DEG FERDIG: `node --check` på endret JS, sjekk at no/en har like mange
  nøkler (kommandoen i CLAUDE.md), og test BEGGE språk i nettleser.
- STOPP og rapporter hvis et STOPP-kriterium i prompten ikke er oppfylt. Ikke gå videre.
```

---

## ✅ PROMPT 1 — DB: generisk smertemodell + backfill  (vanntett, gjør først)

```
Oppgave: Lag migrasjon supabase/migrations/042_injury_pain.sql som flytter
smertesporing fra hardkodet kne til generisk per-skade, UTEN å miste eksisterende data.

1) Inspiser først faktisk skjema: les 001_init.sql, 024_injuries.sql, og evt. senere
   migrasjoner som rører knee_pain, sprint_log, gym, og RLS-policyene (003_rls_policies.sql).
   Finn den FAKTISKE RLS-policy-stilen som brukes på knee_pain og kopier nøyaktig samme
   mønster til den nye tabellen (ikke finn opp ny).

2) Opprett tabell (additivt, idempotent):
   create table if not exists injury_pain (
     id uuid primary key default gen_random_uuid(),
     injury_id uuid references injuries(id) on delete cascade,
     date date not null,
     session_type text,
     source text,        -- 'sprint' | 'gym' | 'manual' | 'legacy_knee_pain' | 'legacy_sprint'
     before_score integer,
     during_score integer,
     after_score integer,
     day_after_score integer,
     notes text,
     created_at timestamptz default now()
   );
   create index if not exists injury_pain_injury_date_idx on injury_pain (injury_id, date desc);
   -- + RLS aktivert med SAMME policy-mønster som knee_pain bruker.

3) Sørg for at en kne-skaderad finnes, og backfill ALL eksisterende kne-data inn på den.
   Bruk en DO-blokk: finn kne-injury (body_part ilike '%kne%' eller '%knee%', eller
   note ilike '%patellar%'); hvis den ikke finnes, opprett den
   (body.knee, left, active, severe, 2026-01-09). Deretter:
     - insert fra knee_pain  → source='legacy_knee_pain'
     - insert fra sprint_log (der minst én knee_* er not null) → source='legacy_sprint'
   Begge inserts skal være idempotente med NOT EXISTS på (source, injury_id, date),
   så migrasjonen tåler å kjøres flere ganger uten duplikater.

4) IKKE rør/slett knee_pain eller sprint_log.knee_* kolonner. De beholdes som sikkerhetsnett.

5) Skriv en verifiserings-SQL nederst (som kommentar + som faktisk SELECT du kjører) som
   sammenligner antall:
     knee_pain-rader              == injury_pain(source='legacy_knee_pain')
     sprint_log m/ knee-data      == injury_pain(source='legacy_sprint')

STOPP-KRITERIER (ikke fortsett hvis brutt):
- Verifiserings-tellingene matcher IKKE parvis → noe data mangler. Ikke commit.
- Migrasjonen er ikke idempotent (andre kjøring lager duplikater).
- RLS mangler eller avviker fra knee_pain-mønsteret.

Lever: migrasjonsfila + utskrift av verifiserings-SELECT som bevis på at tellingene matcher.
```

---

## ✅ PROMPT 2 — Logging per skade (sprint.html + gym.html)  (vanntett)

```
Oppgave: Erstatt den hardkodede "KNESMERTE (0–10)"-blokken (Før/Under/Etter/Dagen etter)
i sprint.html OG gym.html med en generisk blokk som rendres ÉN gang per "alvorlig
behandlet" skade (severity='severe' og status in active/improving), lest fra injuries.

Krav:
- Hent aktive alvorlige skader fra injuries ved sidelast. For hver: render en
  smerteblokk med skadens navn som overskrift (via t()/body_part, tospråklig), med samme
  fire faser og 0–10-knapper som dagens kne-blokk. Ingen skade alvorlig → ingen blokk
  (vis en kort "ingen aktive plager"-tekst via t()).
- Lagring: skriv hver blokk til injury_pain (injury_id, date, session_type/type, source,
  scorer, notes).
- MANUELL / TILBAKEDATERT REGISTRERING (viktig — så grafen fylles fra dag én for en
  helt ny alvorlig skade): legg til en liten "manuell smerteoppføring" per aktiv alvorlig
  skade med en datovelger (default i dag, kan velge fortid) + de fire 0–10-fasene (la
  blanke felt være null). Lagre med source='manual'. Dette lar Filip fylle inn f.eks. den
  siste ukens hamstring-smerte fra hukommelsen uten å ha logget økter de dagene. Datovelger
  skal også finnes på den vanlige økt-loggingen, så en økt kan tilbakedateres.
- DOBBELTSKRIVING: for kne-skaden spesifikt, fortsett å skrive til de gamle kolonnene
  (knee_pain og/eller sprint_log.knee_*) i tillegg, så dashboard/treningsplan/widget som
  ennå ikke er migrert fortsatt virker. Legg dette bak én tydelig hjelpefunksjon som er
  lett å fjerne i P6.
- i18n: ingen hardkodet "Knesmerte"/"Før"/"Under" osv. Alt via data-i18n/t(). Nye nøkler i
  begge språk. Dynamisk innhold må re-rendres i onLangChange (se CLAUDE.md).

STOPP-KRITERIER:
- "Knesmerte" (eller annen hardkodet kroppsdel) finnes fortsatt som ren tekst i koden.
- Lagring av en økt feiler, eller kne-data slutter å dukke opp i eksisterende visninger
  (dobbeltskriving virker ikke).
- no/en har ulikt antall nøkler, eller node --check feiler.
- Tekst lekker på feil språk ved språkbytte.

Lever: skjermbilder av begge språk + bekreftelse på at en lagret testøkt havner i BÅDE
injury_pain og gammel kne-kolonne.
```

---

## ✅ PROMPT 2.5 — Per-skade smerte i treningsplan.html (økthistorikk)

Fokusert utdrag av P4, kjøres før P3 fordi økthistorikkens redigering fortsatt var
hardkodet til kne etter P2.

```
KONTEKST: injuries-tabellen er kilde-til-sannhet. "Alvorlig behandlet" = severity='severe'
OG status in ('active','improving'). Tospråklig: all synlig tekst via t()/data-i18n, nye
nøkler i BÅDE no og en i utils.js. node --check + nøkkel-paritet før ferdig.

OPPGAVE: I treningsplan.html viser og redigerer økthistorikken fortsatt KUN kne (hardkodet
"KNESMERTE" + én "REDIGER SMERTEVERDIER" med fire felt). Gjør den per-skade, akkurat som P2
gjorde med sprint/gym.

KRAV:
- Per økt: render én smerteblokk PER aktiv alvorlig skade, lest fra injuries — ikke én
  hardkodet kne-blokk. Hver blokk merkes med skadenavnet (tospråklig), ikke generisk
  "KNESMERTE". Det skal stå tydelig hvilken skade man logger på.
- Last eksisterende verdier fra injury_pain for (injury_id, økt-dato). For kne: fall tilbake
  til legacy (knee_pain / sprint_log.knee_*) hvis injury_pain mangler.
- Lagring skriver til injury_pain per skade. Behold dobbeltskriving til de gamle kne-kildene
  (samme hjelper som P2, P6-fjernbar).
- Sammendragslinjen per økt ("Før/Under/Etter/D.etter: 0") skal også vises per skade, merket.
- onLangChange re-rendrer både sammendrag og redigerings-drawer.

STOPP: kneet forsvinner; hamstring kan ikke redigeres; tekst lekker på feil språk;
node --check feiler; no/en har ulikt antall nøkler.
```

---

## PROMPT 3 — Dashboard: statuskort + grafserie per alvorlig skade

```
Oppgave: I dashboard.html, gjør "KNESMERTE"-statuskortet og grafen "BELASTNING × KNESMERTE"
generiske.
- Statuskort: render ett kort per alvorlig skade (severity=severe, status active/improving),
  med skadens navn (tospråklig). Les fra injury_pain; for kne, fall tilbake til gammel
  kne-data hvis injury_pain er tom (pga dobbeltskriving er begge ok).
- Graf: behold ÉN graf, men én smerte-serie per alvorlig skade (f.eks. kne + hamstring),
  ulik farge, i tillegg til ACWR/belastning. Tittel blir "BELASTNING × SMERTE" (tospråklig).
- archived/mild/moderate skal IKKE vises her.
- Grafen skal tegnes SELV med få datapunkter (også source='manual'). Ikke skjul grafen
  eller serien fordi datagrunnlaget er tynt — en halvfull graf er ønsket, ikke ingen graf.
- onLangChange må re-rendre kort + graf-labels.

STOPP: kneet forsvinner eller dobler seg; graf-serier mangler ved språkbytte; node --check feiler;
nøkkel-paritet brutt.
```

---

## PROMPT 4 — Treningsplan: rehab-kort + trend per skade

```
Oppgave: I treningsplan.html, gjør "KNE & REHAB"-kortet (dager-siden-smerte, streak) og
"Knesmerte"-trenden generiske: ett rehab-kort + én trendlinje per alvorlig skade, lest fra
injury_pain. "Dager siden smerte" og streak beregnes per injury_id. Per-økt-visningen
(Før/Under/Etter/D.etter) i økthistorikken må kunne vise flere skader hvis flere er alvorlige.
Tospråklig, onLangChange re-rendrer. Samme STOPP-kriterier som P3.
```

---

## PROMPT 5 — AI-kontekst + widget leser generisk smerte

```
Oppgave: Oppdater api/_lib/context.js (og api/widget.js / widget-scriptene) til å lese
smerte fra injury_pain per skade, ikke kun fra knee_pain/sprint_log.knee_*. AI-Overseer skal
se smertetrend for ALLE aktive/bedring-skader, ikke bare kne. Behold bakoverkompatibel
fallback til gamle kolonner til P6 er gjort. STOPP hvis AI-konteksten mister kne-historikk.
```

---

## PROMPT 6 — Opprydning (HELT til slutt, kun når alt over er verifisert i drift)

```
Oppgave: Når dashboard, treningsplan, AI og widget alle leser fra injury_pain og er testet
over noen dagers reell bruk: fjern dobbeltskrivingen fra P2 og marker knee_pain +
sprint_log.knee_* som deprecated (IKKE drop ennå — egen migrasjon senere når du er trygg).
Søk etter gjenværende "kne"/"knee"-hardkoding og rydd. STOPP hvis noe fortsatt leser de gamle
kildene.
```

---

## Rekkefølge og risiko

1. **P1** (DB) — må først. Lavest risiko (additiv), høyest verdi. Backfill-verifisering er gaten.
2. **P2** (logging) — gjør at hamstring faktisk *kan* logges. Dobbeltskriving holder resten i live.
3. **P3** (dashboard) — første synlige resultat: hamstring-kort + grafserie.
4. **P4 → P5** — treningsplan, så AI/widget.
5. **P6** — opprydning sist, uten hastverk.

Etter hvert punkt: `node --check`, nøkkel-paritet (no==en), test begge språk, commit. Aldri
flere punkter i én commit.
