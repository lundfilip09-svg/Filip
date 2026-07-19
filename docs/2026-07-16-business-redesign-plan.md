# Business-modul — Redesign-plan

*2026-07-16. Grunnet i faktisk kode (`business.html` 1749 linjer, `present.html` 358 linjer). Strategisk kritikk, ikke implementering — ingen kode skrevet.*

> **Rammebetingelse:** Frilans Finans er kilde til sannhet for all fakturering, betaling og regnskap. Business-modulen er et **internt oversiktsverktøy** som viser hva kunden skal betale, hva som er betalt og forventede inntekter. Den skal ikke generere fakturaer, beregne MVA eller føre regnskap. Ingen forslag under innfører dobbeltregistrering eller overtar Frilans Finans sine oppgaver.

---

## Kjernediagnose (korrigert etter kodelesing)

Modulen er faktisk to faner: **Regnskap** og **Produkter & priser**. Problemet er ikke for mange sider — det er at **«Regnskap»-fanen gjør fire urelaterte jobber stablet vertikalt**: økonomisk oversikt (metrikk-fliser), kunderegister (tabell), utgiftssporing (Lovable), og prospektering (Lead Generator). Fanenavnet «Regnskap» beskriver bare den første. Det er derfor modulen føles som en samling funksjoner — fordi én fane *er* en stabel av fire funksjoner uten felles logikk.

De tre konkrete svakhetene, i synkende alvorlighet:

1. **Metrikk-flisene villeder** fordi de blander tidsenheter uten å merke dem.
2. **Kundetabellen er bygget for redigering, men brukes til oversikt** — alt er alltid-redigerbart, med for mange kontroller per rad.
3. **Lead Generator hører ikke hjemme under «Regnskap»** — feil kategorisering skaper den «tilfeldige» følelsen.

---

## Område 1 — Regnskap / Kundeliste

### 1a. Metrikk-flisene lyver om tidsenhet (høyest verdi å fikse)

Fra `renderMetrics()` (linje ~900) og hjelperne over:

- `revenue` = sum av månedlig `price` for **kun aktive** kunder → dette er MRR (månedlig).
- `oneTime` = sum av `oneTimeFee` for **alle** kunder, uansett status → kumulativ, all-time.
- `expense` = Lovable-kostnad → månedlig.
- `profit = revenue − expense` → en **månedlig** figur som **ikke inkluderer engangsinntekt i det hele tatt**.

Fire visuelt identiske fliser presenterer tre forskjellige tidsbaser side om side. «Profit» ser ut som totalresultatet ditt, men er egentlig «månedlig abonnementsmargin etter Lovable» — og «One-time revenue» teller inntekt fra kunder som ikke lenger er aktive. Dette er den mest villedende delen av hele modulen, og den billigste å fikse.

**Grep:** merk hver flis med tidsbase i selve etiketten — «Månedlig inntekt (MRR)», «Engangsinntekt (totalt)», «Månedskostnad», «Månedsresultat». Vurder om «One-time» bør filtreres til inneværende år eller aktive kunder for å bety noe. Og bestem: skal «Profit» være rent månedlig (MRR − kostnad), eller vil du ha en egen «Forventet i år»-flis som kombinerer 12×MRR + engangsinntekt? Akkurat nå svarer flisene på et spørsmål ingen stilte.

### 1b. Tabellen er et regneark der du trenger en oversikt

Hver kundecelle er et live input/select (`cust-name`, `cust-contact`, `cust-tier`, `cust-bizmodel`, `cust-price`, `cust-onetime`, `cust-date`) — pluss status-dot, deposit-dot og fem handlingsknapper. Det er ~10 interaktive kontroller per rad, alltid synlige. Du har bygget en editor. Men den daglige jobben din er *å lese* status — hvem er aktiv, hvem har betalt depositum, hva er forventet inntekt. Alltid-redigerbart betyr høy visuell støy og lett feilklikk (ett uhell endrer en pris).

**Grep (Stripe/Linear/Notion-mønster):** vis tabellen i **lesemodus** som standard — ren tekst, tett, skummbar. Klikk på en rad åpner en **detalj-drawer** for redigering. Du har allerede akkurat dette mønsteret i `treningsplan.html` («klikk-for-detalj-drawer») — gjenbruk det, ingen ny UI-idé nødvendig. Drawer samler: kontaktinfo, tier, forretningsmodell, pris, engangsbeløp, startdato, notater, spesifisert omfang, kontrakt-utskrift, present-lenke, bekreft, slett. Tabellen blir da ren oversikt; redigering og sjeldne handlinger flytter inn i drawer.

### 1c. Fem emoji-knapper per rad — fire brukes én gang i livet

Handlingsklyngen per rad: 📝 notater, 🖨️ skriv ut kontrakt, 🔗 generer token, 📋 bekreft kontrakt, 🗑️ slett. Frekvensanalyse:

- **Ofte:** status-dot, deposit-dot (klikk for å veksle — dette er bra, matcher ditt eksplisitt-handling-prinsipp fra investeringsjournalen). Behold inline.
- **Én gang per kunde:** skriv ut kontrakt (ved signering), generer token (når du sender present-lenke), bekreft kontrakt (ved signering).
- **Sjelden:** slett, notater.

Fire av fem okkuperer permanent horisontal plass på hver rad for alltid, selv om de brukes én gang i kundens levetid. Emoji som funksjonelle ikoner er dessuten tvetydige (📋 = bekreft? 🔗 = token?) og ser mindre profesjonelt ut.

**Grep:** flytt de sjeldne inn i detalj-draweren (1b) eller en «…»-meny per rad. Behold kun status + deposit inline. Erstatt emoji med enten tekstknapper i draweren eller konsistente linje-ikoner (du bruker allerede rene SVG-ikoner for slett — samme stil for resten).

### 1d. Kolonne-overlapp: Tier vs Forretningsmodell vs Pris vs Engangsbeløp

Fire kolonner beskriver overlappende ting: `tier` (Lav/Medium/Høy/Custom), `businessModel` (A/B/C), `price` (månedlig) og `oneTimeFee`. Forretningsmodell C har ingen deposit («—») — så modellen bestemmer allerede om depositum og månedspris er relevant. Det er sannsynlig redundans her: tier + forretningsmodell impliserer ofte prisstrukturen. En bruker som skanner tabellen må tolke fire kolonner for å forstå én avtale.

**Grep:** verifiser hva hver kolonne faktisk styrer. Hvis forretningsmodell avgjør *om* det er månedspris eller engangs, vurder å slå sammen «Pris» og «Engangs» til én «Beløp»-kolonne med et lite merke (/mnd eller engang) styrt av modellen. Mindre å lese, samme informasjon.

### 1e. To dot-systemer side om side uten forklaring

Status-dot og deposit-dot står i nabokolonner, begge små sirkler i ulike farger. Uten en tegnforklaring er det ikke opplagt hvilken som er hva, eller hva hver farge betyr.

**Grep:** legg til en kompakt fargeforklaring over tabellen, eller gi kolonnene tydelige mikro-etiketter. Alternativt: la statuskolonnen vise en liten tekst-pill («Aktiv», «Lead», «Pauset») i stedet for bare farge — Linear-stil status-pills leser raskere enn fargekoder du må huske.

---

## Område 2 — Produkter & priser

Koden viser at fanen er en `sales-hero` + et grid av `.sales-card` med glød-effekter og hover-løft (`transform:translateY(-3px)`, `box-shadow`). Det er landing-page-styling — på en intern flate. Din egen framing: den skal hjelpe *deg* forklare priser. Men du har allerede en dedikert, kundevendt, token-beskyttet versjon: `present.html` (egen fil, «ingen nav, ingen kundedata», samme kort-design). Så pen-kort-jobben er allerede løst ett sted.

Det betyr at den interne «Produkter & priser»-fanen dupliserer present.html sitt uttrykk uten å ha present.html sin hensikt.

**Grep:**

- **Gjør den interne fanen tabellbasert.** Kolonner: pakke/tier, pris, hva som inngår, og — det du mangler — **din margin** (pris minus din Lovable-andel/kostnad). Marginkolonnen er tallet du faktisk trenger når du vurderer rabatt i en kundesamtale. Ingen glød, ingen hover-løft, ingen hero.
- **La present.html beholde de pene kortene.** Det er den kunden ser; der hører polish hjemme.
- **Fjern duplisering.** Den interne fanen og present.html bør lese samme `pricing_tiers`-data (det gjør de delvis allerede via `updatePricingFromDb`), men ikke dele det tunge kort-uttrykket. Intern = tett tabell, ekstern = kort.
- **Kutt overflødig tekst** i den interne visningen: `sales-card-desc`, badges og ikoner er salgsspråk. Internt vil du ha fakta på én linje.

---

## Område 3 — Modulen som ett produkt

**Flytt Lead Generator ut av «Regnskap».** Det er prospektering (kald, mange, generer LLM-prompt), ikke økonomi. Dette er den klareste «passer ikke inn»-feilen. Gi den en egen fane. Da blir fanene ærlige.

**Fold Lovable inn i oversikten.** Lovable-seksjonen er én dropdown som mater `expense`-tallet, men får en full kortseksjon med tittel likestilt kunderegisteret. Overvektet for ett tall. Flytt plan-velgeren til en liten linje i eller under Command Center, som «kilden» til utgiftsflisen. Sparer vertikal plass og fjerner en seksjon som føles løsrevet.

**Døp om fanene til det de faktisk er.** «Regnskap» inneholder oversikt + kunder + utgift. Et ærligere kart:

- **Kunder** (metrikk-fliser + kundetabell + Lovable-linje) — økonomisk oversikt og kunderegister hører sammen fordi metrikkene *beregnes fra* kundene.
- **Leads** (Lead Generator alene).
- **Priser** (den interne pristabellen).

present.html og kontrakt-PDF forblir det de er — **outputs** utløst per kunde (token-lenke og utskrift fra draweren), ikke egne faner. Det er allerede riktig arkitektonisk; ikke rør det utover å flytte utløserne inn i draweren (1b/1c).

**Netto kognitiv gevinst:** hver fane svarer nå på ett spørsmål. Tabellen leses uten å tolke ti kontroller per rad. Flisene lyver ikke om hva de måler. Ingenting føles tilfeldig fordi ingenting ligger under feil overskrift.

---

## Prioritering

| # | Grep | Effekt | Risiko | Kostnad |
|---|------|--------|--------|---------|
| 1 | **Merk metrikk-flisene med tidsbase** + bestem hva «Profit» betyr | Svært høy | Svært lav | Svært lav |
| 2 | **Flytt Lead Generator til egen fane** | Høy (opplevd sammenheng) | Svært lav | Lav |
| 3 | **Tabell → lesemodus + detalj-drawer** (gjenbruk treningsplan-mønster) | Svært høy | Middels | Middels–høy |
| 4 | **Flytt sjeldne rad-handlinger inn i draweren/«…»-meny**, behold kun status+deposit inline | Høy | Lav | Lav–middels |
| 5 | **Produkter & priser → intern tabell m/ margin-kolonne**, dropp hero/glød | Høy | Lav | Lav–middels |
| 6 | **Fold Lovable inn i oversikten** som utgiftskilde | Middels | Svært lav | Lav |
| 7 | **Status-pills + fargeforklaring** for dot-kolonnene | Middels | Svært lav | Lav |
| 8 | **Kolonne-audit** (slå sammen Pris/Engangs styrt av forretningsmodell) | Middels | Middels (verifiser logikk først) | Lav–middels |
| 9 | **Erstatt emoji-ikoner med SVG/tekst** | Lav–middels | Svært lav | Lav |

**Rekkefølge:** #1 og #2 er nesten gratis og fjerner de to mest villedende/tilfeldige tingene — gjør dem i dag. #3 er den strukturelle vinneren men krever mest arbeid; #4 faller naturlig ut av #3. #5–#9 er opprydding.

---

## Én ting å avklare før implementering

Detalj-draweren (#3) er navet resten henger på. Bestem: skal kundetabellen bli **lese-først med drawer for redigering** (anbefalt — matcher at modulen er en *oversikt*, og gjenbruker et mønster du allerede har), eller vil du beholde inline-redigering fordi du oppdaterer priser/status ofte nok til at et regneark er raskere? Det valget avgjør #3 og #4. Ikke skriv kode før det er avgjort.
