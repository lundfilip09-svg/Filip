# Business-modul — Komplett redesign-spesifikasjon

*2026-07-16. Skrevet av produktansvarlig/designer-rolle, grunnet i faktisk kode. Dette er en implementeringsklar spesifikasjon — en frontend-utvikler skal kunne bygge dette uten egne designvalg. Ingen kode her; dette er hva som skal bygges og hvorfor.*

> **Rammebetingelse (uendret):** Frilans Finans er kilde til sannhet for fakturering, betaling og regnskap. Business-modulen viser *status* på penger (forventet, betalt, utestående) — den fakturerer ikke, beregner ikke MVA, fører ikke regnskap.

---

## 0. Hva jeg endrer fra tidligere råd (selvkritikk)

Fire ting i mine forrige planer var for forsiktige eller feil. Jeg forkaster dem:

1. **«Behold 3 faner, bevar strukturen.»** For pusete. Den virkelige feilen er at pipelinen mangler. Jeg redefinerer `status` til en full livssyklus (Lead → Tilbud → Kontrakt → Aktiv → Pauset → Avsluttet) slik at ett kunde-record dekker hele reisen fra prospekt til betalende. Leads slutter å være efemere prompt-kopier og blir starten på pipelinen.

2. **«Merk metrikk-flisene med tidsenhet.»** For timid. Jeg erstatter de fire flisene helt: én hero-MRR + tre meningsfulle fliser + en **ny, handlingsdrivende «utestående depositum»-varsling** som ikke finnes i dag. Å bare sette etiketter fikset ikke at ingen flis fortalte deg hvem du må purre.

3. **«Inline-redigering vs drawer — du bestemmer.»** Nå bestemmer jeg: tabellen er **lese-først**, redigering skjer i et **kontekst-panel** med en **stadie-drevet primærknapp** (neste steg i pipelinen). Regneark-modusen forsvinner.

4. **«Flytt sjeldne rad-ikoner til en …-meny.»** Utilstrekkelig. Hele signeringsflyten (kontrakt-utskrift, token-lenke, e-postmal, bekreft, depositum) samles i én gruppe «Kontrakt & betaling» i panelet, sortert i rekkefølgen du faktisk gjør dem. Bedre enn en meny med løse ikoner.

---

## 1. Produktdefinisjon

Business-modulen er et **lettvekts CRM for en enkeltperson som selger og drifter nettsider til lokale bedrifter.** Den har tre jobber, i fallende bruksfrekvens:

- **Drive** (daglig/ukentlig): se helsen (MRR, resultat, hvem skylder depositum), oppdatere status.
- **Selge** (per prospekt): flytte en bedrift gjennom pipelinen — prospekt → tilbud → kontrakt → aktiv.
- **Prospektere** (i støt): generere LLM-prompter for research/nettside/kontakttekst.

Alt henger på **kunden** som sentral enhet, og på **stadiet** kunden er i. Det er de to aksene hele modulen organiseres rundt.

---

## 2. Informasjonsarkitektur

Én modul, tre flater, valgt via et **segmentert kontroll** øverst (Linear-stil, ikke de gamle fane-knappene):

```
Business        [ Kunder │ Leads │ Priser ]                 [+ Ny kunde]
```

| Flate | Jobb | Frekvens | Innhold |
|-------|------|----------|---------|
| **Kunder** (default) | Drive + selge | Daglig | Nøkkeltall + pipeline-tabell + detaljpanel |
| **Leads** | Prospektere | I støt | Prompt-generator (3 typer) + «legg til som lead» |
| **Priser** | Referanse | Sjelden | Intern pristabell m/ margin |

**Det som forsvinner som egen seksjon:**
- **Lovable-kortet** → blir én redigerbar linje i nøkkeltall-raden på Kunder («Faste kostnader»). Det er ett tall; det fortjener ikke en seksjon.
- **«Business Command Center»-tittelen** → fjernes. Nøkkeltall trenger ingen overskrift; de *er* toppen av siden.
- **Notat-modalen** → forsvinner som egen modal; blir en seksjon i detaljpanelet.
- **Salgs-hero/glød-kortene i den interne prisfanen** → erstattes av tabell. De pene kortene lever videre kun i `present.html` (kundevendt).

**Det som forblir outputs (ikke flater):** `present.html?view=pakker` (tilbud til kunde), `present.html?view=kontrakt&token=` (kontrakt til signering), kontrakt-utskrift, e-postmal. Alle utløses fra detaljpanelet per kunde.

---

## 3. Flate: KUNDER

### 3.1 Hva brukeren prøver å oppnå
Svare på tre spørsmål på under fem sekunder: *Hvordan går det? Hvem må jeg følge opp? Hva er neste steg for hver avtale?* — og gjøre små statusoppdateringer uten friksjon.

### 3.2 Layout (topp til bunn)

**A) Nøkkeltall-rad**

Erstatter dagens fire villedende fliser. Alle beløp får eksplisitt tidsbase.

```
┌──────────────┬───────────────────┬────────────────┬────────────────┐
│  MRR         │  Engangsinntekt   │  Månedskostnad │  Månedsresultat│
│  12 400 kr   │  i år: 38 000 kr  │  480 kr        │  11 920 kr     │
│  /mnd (hero) │                   │  Lovable ▾     │  MRR − kostnad │
└──────────────┴───────────────────┴────────────────┴────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│  ⚠  Utestående depositum · 2 kunder · 4 500 kr        [ Vis dem → ]   │
└──────────────────────────────────────────────────────────────────────┘
```

Definisjoner (utvikler implementerer nøyaktig disse):

| Flis | Formel | Merk |
|------|--------|------|
| **MRR** (hero, størst) | Σ `price` for kunder med status = Aktiv | «kr/mnd» |
| **Engangsinntekt i år** | Σ `oneTimeFee` for kunder med `start`-år = inneværende år | «i år» — bundet, ikke all-time |
| **Månedskostnad** | Lovable-plan × FX | Selve plan-velgeren ligger inline her (dropdown i flisen) |
| **Månedsresultat** | MRR − Månedskostnad | Grønn hvis ≥ 0, rød hvis < 0 |
| **Utestående depositum** (varsling) | Antall + Σ depositum for kunder i stadie Kontrakt med `depositPaid = false` | Klikk «Vis dem» filtrerer tabellen til disse |

Depositum-beløp = 25 % av `oneTimeFee` (samme som `printContract`-logikken, linje ~1159). Vis kun varslingen når antallet > 0; ellers skjul hele stripen.

*Hvorfor bedre:* dagens «Profit» ekskluderte engangsinntekt og «One-time» talte inaktive kunder — tallene svarte på spørsmål ingen stilte. Nå er hvert tall meningsfullt og tidsbundet, og det ene tallet som krever handling (hvem skylder depositum) er ikke lenger usynlig.

**B) Filter + søk**

```
[ Alle │ Pipeline │ Aktive │ Avsluttet ]              🔍 [ søk navn… ]
```

- **Pipeline** = Lead + Tilbud + Kontrakt (alt som ikke er lukket ennå). Dette er selger-visningen.
- **Aktive** = status Aktiv + Pauset. Dette er drift-visningen.
- **Avsluttet** = arkiv.
- **Alle** = alt.
- Standardfilter ved lasting: **Aktive** (det du ser på oftest).

**C) Kunde-tabell (lese-først)**

Ingen input-felter i cellene. Ren, skummbar tekst. Klikk på rad → detaljpanel.

| Kolonne | Innhold | Bredde |
|---------|---------|--------|
| **Kunde** | Navn, fet. Under: kontakt i grått, mindre. | fleks |
| **Status** | Pill med farge + tekst (se 3.4) | 120px |
| **Pakke** | «Tier · Modell» lesbar, f.eks. «Høy · Abonnement» / «Prosjekt» | 160px |
| **Beløp** | Ett tall, enhet avledet fra modell: «990 kr/mnd» *eller* «15 000 kr engang». Abonnement viser /mnd; engangsmodell viser engang. | 130px, høyrejustert |
| **Depositum** | Pill: Betalt (grønn) / Utestående (rød) / — (n/a for modeller uten depositum) | 110px |
| **Start** | Dato, `fmtLocale` | 100px |

Kun **to** interaktive elementer per rad, begge klikk-for-handling (matcher ditt eksplisitt-handling-prinsipp fra investeringsjournalen):
- **Status-pill**: klikk åpner en liten stadie-velger (ikke blind syklus — vis alternativene). Sekundær.
- **Depositum-pill**: klikk veksler Betalt/Utestående direkte. Sekundær.

Alt annet (rediger felt, kontrakt, token, notat, slett) skjer i panelet. Dagens ~10 kontroller + 5 emoji-knapper per rad → 2 pills + klikkbar rad.

*Fjernet fra raden:* inline-inputs, 📝🖨️🔗📋 og slett-ikonet. *Flyttet:* alt til panelet (3.3).

### 3.3 Detaljpanel (høyre drawer — gjenbruk `treningsplan.html`-mønsteret)

Glir inn fra høyre ved rad-klikk. Bredde ~460px, mørk glass, samme tokens som notat-modalen bruker i dag.

**Panel-header**
- Navn (klikk for å redigere inline).
- Status-pill (samme stadie-velger).
- Kontakt (e-post/telefon, klikk for å redigere).
- **Kontekst-primærknapp** øverst til høyre — teksten avhenger av stadiet (dette er kjernen i «gjennomført produkt»):

| Stadie | Primærknapp | Handling |
|--------|-------------|----------|
| Lead | **Send tilbud** | Kopier `present.html?view=pakker`-lenke + åpne e-postmal, sett stadie → Tilbud |
| Tilbud | **Lag kontrakt** | Kjør `printContract` + generer token-lenke, sett stadie → Kontrakt |
| Kontrakt | **Marker bekreftet** | Sett `bekreftedDato` = i dag, sett stadie → Aktiv |
| Aktiv | **Marker depositum betalt** (kun hvis utestående), ellers ingen | Veksle `depositPaid` |
| Pauset/Avsluttet | **Gjenåpne** | Sett stadie → Aktiv |

Primærknappen fjerner gjetting: den viser alltid det neste steget i pipelinen. Sekundære handlinger ligger under.

**Seksjon: Avtale** (redigerbar — dette er stedet redigering er lov)
- Tier (Lav/Medium/Høy/Custom)
- Forretningsmodell (A/B/C/Custom) — behold eksisterende semantikk
- Månedspris (`price`)
- Engangsbeløp (`oneTimeFee`)
- Startdato (`start`)
- Spesifisert leveranse / omfang (`customScope`) — flyttet hit fra notat-modalen

**Seksjon: Kontrakt & betaling** (samler hele signeringsflyten i rekkefølge)
1. **Skriv ut kontrakt** (`printContract`) — sekundær
2. **Kopier kontrakt-lenke** (token → `present.html?view=kontrakt&token=`) — sekundær
3. **Kopier e-postmal** (dagens `copyEmailBtn`-tekst) — sekundær
4. **Bekreftet:** dato-visning (`bekreftedDato`) eller «Marker bekreftet»
5. **Depositum:** pill Betalt/Utestående (25 % av engang vises som beløp)

*Hvorfor bedre:* i dag er disse fem fire løsrevne emoji-ikoner på raden + en modal. Nå er de én ordnet sekvens som speiler den faktiske jobben: skriv ut → send lenke → send e-post → vent på bekreftelse → registrer depositum.

**Seksjon: Notater** — fritekst (`notes`). Erstatter notat-modalen helt.

**Seksjon (nederst, adskilt): Faresone**
- **Slett kunde** — sekundær, rød, krever bekreftelse (matcher din CLAUDE.md-regel om bekreftelse før sletting).

### 3.4 Statusmodell (utvidelse — krever avklaring, se §7)

Erstatt dagens tre statuser med seks stadier. Ett felt, `status`, styrer hele pipelinen.

| Stadie | Farge | Betydning | Teller i MRR? |
|--------|-------|-----------|---------------|
| **Lead** | grå | Prospekt, ikke solgt | Nei |
| **Tilbud** | blå | Pakke/pris presentert | Nei |
| **Kontrakt** | lilla | Kontrakt sendt, venter signatur/depositum | Nei |
| **Aktiv** | grønn | Signert, løpende | **Ja** |
| **Pauset** | gul | Midlertidig av | Nei |
| **Avsluttet** | grå/dempet | Arkiv | Nei |

Pills med tekst leser raskere enn dagens fargekoder du må huske. Én liten fargeforklaring er unødvendig når teksten står i pillen.

---

## 4. Flate: LEADS

### 4.1 Hva brukeren prøver å oppnå
Raskt produsere en LLM-prompt for ett av tre formål, kopiere den, og lime inn i en ekstern LLM. Sekundært: gjøre et lovende prospekt om til en pipeline-oppføring.

### 4.2 Layout

Tre prompt-typer som segmentert kontroll (ikke dropdown — de er likestilte moduser):

```
[ Research │ Nettside-prompt │ Kontakttekst ]
```

- **Research:** felt Sted + Bransje (valgfritt). Output: prompt for å finne bedrifter.
- **Nettside-prompt:** felt Bedriftnavn + Google Maps-utklipp. Output: Lovable-byggeprompt.
- **Kontakttekst:** felt Bedriftnavn + åpningstider/anmeldelser-utklipp. Output: kald-kontakt-tekst.

Under feltene:
- **Prompt-forhåndsvisning** (read-only tekstboks som viser den genererte prompten live). I dag ser du aldri hva du kopierer før du limer inn. Å vise den bygger tillit og lar deg finpusse input.
- **Primærknapp: «Kopier prompt»** (dagens copy-flyt).
- **Sekundærknapp: «Legg til som lead»** (kun i Research/Kontakttekst der du har et bedriftnavn) → oppretter en kunde med status = Lead, navn utfylt. Dette er broen som gjør Leads til starten på pipelinen i stedet for et isolert verktøy.

### 4.3 Frekvens / prioritet
- **Ofte:** velge type, lime inn utklipp, kopiere. → Primær flyt, minimal friksjon.
- **Sjelden:** «legg til som lead». → Sekundær.
- **Fjern:** ingenting funksjonelt; men rydd feltene til kun det som trengs per type (skjules allerede med `hidden`).

---

## 5. Flate: PRISER

### 5.1 Hva brukeren prøver å oppnå
Intern referanse: raskt se hva hver pakke koster, hva som inngår, og **din margin**, når du forklarer/forhandler pris. Den skal ikke selge — `present.html` selger.

### 5.2 Layout — tabell, ikke kort

Fjern `sales-hero`, glød og hover-løft. Én tett tabell:

| Kolonne | Innhold |
|---------|---------|
| **Pakke / Modell** | Scenario A / B / C-tier (Lav/Medium/Høy) — eksisterende `pricing_tiers` |
| **Hva inngår** | Én linje, kort |
| **Pris** | Med enhet (kr/mnd eller engang) |
| **Din kostnad** | Lovable-andel el. estimert kostnad |
| **Margin** | Pris − kostnad. Tallet du forhandler mot. |

Redigerbar inline her — i motsetning til kundetabellen *er* redigering jobben på denne flaten (du justerer priser). Marginkolonnen er ny og er hele poenget: den lar deg vite hvor lavt du kan gå i en kundesamtale.

`present.html` beholder de pene kortene uendret; begge leser samme `pricing_tiers` via `updatePricingFromDb`. Ingen duplisert kort-CSS internt.

*Fjernet:* hero-tittel, `sales-card-desc` salgstekst, badges, ikoner, glød, hover-transform — alt landing-page-uttrykk som ikke hører hjemme i et internt oppslag.

---

## 6. Komponent- og interaksjonsspesifikasjon

| Element | Type | Primær/sekundær | Interaksjon |
|---------|------|-----------------|-------------|
| Segmentert kontroll (Kunder/Leads/Priser) | Nav | — | Bytt flate, ingen sidelast |
| + Ny kunde | Knapp | **Primær** (global, på Kunder) | Oppretter tom kunde i Lead-stadie, åpner panel |
| Status-pill (rad) | Pill | Sekundær | Klikk → stadie-velger |
| Depositum-pill (rad) | Pill | Sekundær | Klikk → veksle betalt |
| Kunde-rad | Rad | — | Klikk → panel |
| Panel primærknapp | Knapp | **Primær** | Stadie-avhengig (§3.3) |
| Kontrakt/token/e-post/slett | Knapp | Sekundær | I panel |
| Kopier prompt | Knapp | **Primær** (Leads) | Kopier til utklipp |
| Legg til som lead | Knapp | Sekundær (Leads) | Opprett Lead-kunde |
| Pris-celler | Input | — | Inline-rediger (Priser) |

**Fargebruk (gjenbruk eksisterende tokens fra `styles.css`):** blå `#5BA4F5` for primær/aktiv nav, grønn success for MRR/betalt/positivt resultat, rød danger for utestående/negativt, hairline `rgba(255,255,255,.06)` for kortkanter, mono-uppercase for metrikk-etiketter. Ingen nye farger, ingen gradienter/glød utenom `present.html`.

**Tomtilstander (mangler i dag):**
- Ingen kunder i valgt filter → kort melding + «+ Ny kunde».
- Ingen utestående depositum → skjul varslingsstripen helt.
- Tom prompt-forhåndsvisning → dempet «Fyll inn feltene over».

---

## 7. Datamodell & avhengigheter

Nesten alt gjenbruker eksisterende `customers`-kolonner (`tier`, `business_model`, `price`, `one_time_fee`, `start`, `status`, `deposit_paid`, `notes`, `custom_scope`, `bekreftet_dato`, `contract_version`). Ingen ny tabell → ingen RLS-migrasjon nødvendig for kjernen.

**Én endring krever avklaring før bygging:**

`status` må utvides fra {Aktiv, Pauset, Avsluttet} til {Lead, Tilbud, Kontrakt, Aktiv, Pauset, Avsluttet}. Sjekk om det finnes en DB-`CHECK`-constraint eller enum på `customers.status`. Hvis ja → én liten migrasjon (nytt nummer etter 066, følg CLAUDE.md-mønsteret) som utvider tillatte verdier. Hvis status er fri tekst → ingen migrasjon, bare frontend. **Dette er det ene valget som låser resten** (§3.4, §3.3-primærknapp, §4.2 «legg til som lead» avhenger av det).

**i18n (kritisk regel fra CLAUDE.md):** alle nye synlige strenger trenger nøkkel i BEGGE `TRANSLATIONS.no` og `.en` i `utils.js`. Nye nøkler minst: de tre nye stadiene (`biz.status_lead/tilbud/kontrakt`), nøkkeltall-etikettene (`biz.mrr`, `biz.onetime_year`, `biz.monthly_cost`, `biz.monthly_result`, `biz.deposit_outstanding_alert`), filter-segmentene, panel-primærknappene per stadie, margin-kolonnen, prompt-forhåndsvisning, «legg til som lead», tomtilstander. Alle datoer via `fmtLocale`/`Intl`. Re-render dynamiske deler i `onLangChange`.

---

## 8. Byggerekkefølge (for utvikleren)

Rekkefølgen minimerer risiko og gir synlig verdi tidlig:

1. **Nøkkeltall-raden** (§3.2A) — ren frontend, null risiko, fjerner den mest villedende delen. Inkluder utestående-depositum-varslingen og inline Lovable-velger; slett det gamle Lovable-kortet.
2. **Segmentert kontroll + flate-splitt** (§2) — flytt Lead Generator ut til egen Leads-flate, Priser til egen. Rename bort fra «Regnskap».
3. **Statusmodell** (§3.4) — etter §7-avklaringen. Innfør stadie-pills.
4. **Lese-først tabell** (§3.2C) — fjern inline-inputs og rad-ikoner.
5. **Detaljpanel** (§3.3) — gjenbruk treningsplan-draweren; flytt avtale-redigering, kontraktflyt, notater, slett hit. Kontekst-primærknapp.
6. **Priser → tabell m/ margin** (§5).
7. **Leads-flate polish** (§4) — prompt-forhåndsvisning + «legg til som lead».
8. **Verifisering:** `node --check` på endret JS; i18n-nøkkeltelling (no = en); test begge språk; test hver stadieovergang; sjekk at MRR kun teller Aktiv og at utestående-varslingen matcher Kontrakt-stadiet.

Steg 1–2 kan gjøres i dag og gir umiddelbar «dette føles som ett produkt»-effekt. Steg 3–5 er den strukturelle kjernen. 6–7 er polish.

---

## 9. Sluttbilde

Når dette er bygget: du åpner Business, ser MRR og resultat øverst, ser umiddelbart om noen skylder depositum, filtrerer til «Pipeline» for å se hvem som er midt i en salgsprosess, klikker en kunde og får panelet som forteller deg det *neste steget* med én knapp. Prospektering bor på sin egen flate. Priser er et rent oppslag med margin. Ingenting ligger under feil overskrift, ingen rad har ti kontroller, ingen flis lyver om hva den måler. Det er forskjellen mellom en HTML-side som vokste, og et produkt.
