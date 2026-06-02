# Forslag: USA-tilpasning + dashboard-forbedringer

Skrevet 2. juni 2026. To lister: (A) ting som gjør hverdagen din enklere, særlig
med tanke på USA-oppholdet (høst 2026 – vår 2027), og (B) større idéer for
dashboardet. **Ingenting i liste B er bygget** — det er forslag du kan plukke fra.

---

## A · Convenience — gjør dashbordet enklere (særlig for USA)

### A1. Logg lagidrett direkte i øktloggen, ikke bare i treningsoversikten
I dag kan du logge fotball/basket som *aktivitet* i Treningsoversikt, men **Gym-siden
er låst til styrkedager (man/ons/fre)**. På high school kommer soccer og basket til å
være hovedøktene dine flere dager i uka. Forslag: la Gym-loggeren ta en "lagidrett"-økt
med varighet, RPE og knesmerte (før/under/etter), så alt havner samme sted.
*Hvorfor:* da slipper du å hoppe mellom to sider for det som blir den vanligste
treningen din i USA.

### A2. "Basketball"-knappen mangler oversettelse
Liten bug: i Treningsoversikt har Basketball-knappen ingen `data-i18n`. Ordet er likt
på engelsk så det synes ikke, men hvis du noen gang gir den et engelsk-spesifikt navn
lekker det. Trivielt å fikse når du likevel er inne.

### A3. Coach-modus / delbar profil-side (det viktigste for USA)
Du sa du vil **vise dashboardet til trenere i USA og fremstå som en seriøs utøver.**
En egen, ren "for coaches"-visning ville gjort mye:
- PB-er (100m/200m), nøkkeltall, ukentlig treningsvolum, søvn/HRV-trend.
- Skjuler det private (gjøremål, kirke-kalender, detaljerte knenotater).
- Alltid på engelsk, uansett hva appen ellers står på.
- Én lenke eller QR du kan vise på mobil — ingen innlogging for treneren.
*Hvorfor:* en amerikansk coach skanner dette på 20 sekunder og ser at du måler og styrer
treningen din profesjonelt. Det er et sterkt førsteinntrykk.

### A4. Imperial-enheter når språket er engelsk
Amerikanske trenere tenker i pounds, yards/feet og miles, ikke kg/meter. Forslag: når
🇺🇸 er på, vis (eller dobbel-vis) vekter i lbs og distanser/høyde i ft/in. Du er
70 kg / 187 cm = **154 lbs / 6'2"** — tall en US-coach umiddelbart forstår.
*Hvorfor:* fjerner friksjon når du snakker tall med noen der borte.

### A5. Tidssone-håndtering du kan stole på
AI-en tar allerede imot tidssone, men resten av appen bruker maskinens lokale tid.
Når du flytter til en US-tidssone bør "i dag", ukestripa og kalenderen følge med
automatisk. Verdt en rask gjennomgang **før** du reiser, så datoene ikke glipper med
én dag på grunn av UTC-forskyvning.

### A6. Forhåndsvalgte aktiviteter for high school-sesongen
Legg til faste hurtigknapper for det du faktisk kommer til å gjøre i USA: *Soccer
practice, Soccer game, Basketball practice, Basketball game, Track practice, Track meet,
Weightlifting (gym class)*. Da blir logging to trykk, ikke fritekst hver gang.

### A7. Engelsk som standardspråk mens du er borte
Bittelite, men: la språkvalget huske seg selv (det gjør det via localStorage), og
vurder en liten "auto-engelsk hvis enheten står på engelsk"-sjekk første gang. Slipper
å bytte manuelt hver gang du viser noe til noen.

---

## B · Forbedringsforslag for dashboardet (kun idéer — ikke bygget)

### B1. Progressive Overload-coach 💪 (sterkeste idé)
En liten motor som leser gym-loggene dine og foreslår neste økts vekter/reps.
- "Spanish squat ISO: du holdt 2×40 sek smertefritt sist — prøv 2×45 sek."
- Flagg når en øvelse har stått stille i 3+ økter (platå).
- **Kne-bevisst:** aldri foreslå progresjon på en øvelse der du logget smerte > X.
- Kan vises som et lite kort på Gym-siden eller flettes inn i AI Overseer.
*Hvorfor det passer deg:* du kjører HSR/eksentrisk rehab der gradvis, kontrollert
økning er hele poenget. En coach som husker tallene og holder igjen ved smerte er
nøyaktig det Havre-filosofien din handler om.

### B2. Belastnings- / ACWR-graf (acute:chronic workload ratio)
Du logger allerede alt (sprint, styrke, ballidrett, RPE). Regn ut akutt (7 dager) vs
kronisk (28 dager) belastning og vis forholdet. Over ~1.5 = skaderisiko-sone.
*Hvorfor:* gir deg ett tall som fanger "har jeg trappet opp for fort?" — direkte
relevant for patellarsenen, og enda viktigere når soccer/basket legger på ekstra
hopp og retningsendringer du ikke er vant til.

### B3. Kne-dashboard / rehab-streak
En egen liten seksjon som samler alt knerelatert: smerte-trend (linje over tid),
dager siden siste smertefrie økt, og en **streak på daglig rehab** (Spanish squat,
ankel, hip swivels, face pulls). Gamification gjør det lettere å holde "litt hver dag".
*Hvorfor:* "litt rehab hver dag er bedre enn mye sjelden" er kjernen i opplegget ditt
— en streak-teller utnytter at du allerede liker struktur.

### B4. Stevne-/konkurranse-modul
Egen visning for stevner: nedtelling til neste, mål-tider vs PB, og en enkel
"taper"-sjekk (er belastningen riktig nedtrappet de siste 7–10 dagene før?).
Etterpå: logg resultat og koble det mot søvn/HRV/belastning den uka.
*Hvorfor:* "5 gode stevner > 8–10 dårlige" — en modul som hjelper deg toppe formen
til de få viktige stevnene støtter akkurat den strategien.

### B5. Ukentlig oppsummering, automatisk
Hver søndag: et kort sammendrag (kan være AI-generert én gang/uke for å spare token)
— økter fullført vs planlagt, total belastning, snittsøvn/HRV, knetrend, og én ting å
justere neste uke. Kan sendes som en notis eller bare ligge på Dashboard.
*Hvorfor:* fanger trender du ikke ser dag for dag, og koster nesten ingen token når
det kjøres én gang i uka i stedet for at du spør AI-en hele tiden.

### B6. Smartere AI-Overseer uten mer token
Et par grep som gjør chatten mer nyttig *uten* å øke kostnaden:
- **Forhåndsberegn nøkkeltall** (ACWR, snittsøvn, dager siden smertefri) i koden og
  send som korte tall i stedet for at modellen regner fra rådata hver gang.
- **La AI-en skrive korte notater tilbake** til en logg ("foreslo deload uke 23"),
  så den husker egne råd over tid.
- **Ukentlig auto-innsikt** (se B5) i stedet for at du må spørre.

### B7. Eksport til PDF / treningsdagbok
Knapp som lager en ren PDF av en valgt periode — økter, PB-er, grafer. Nyttig å sende
til naprapat, en US-coach, eller bare ha som arkiv.
*Hvorfor:* gjør dataene dine delbare utenfor appen, i et format alle åpner.

### B8. Mørk/lys-tema og litt tilgjengelighet
Liten ting: kontrasten på enkelte grå tekster (f.eks. "Ingen kommende" på 0.11 opacity)
er nesten usynlig. En lett opprydding i kontrast gjør appen mer lesbar — og mer
presentabel når du viser den frem.

---

### Min anbefaling om du bare gjør tre ting før USA
1. **A3 Coach-modus** — størst effekt på målet ditt (vise at du er seriøs).
2. **A1 + A6 lagidrett-logging** — ellers blir den daglige loggingen tungvint der borte.
3. **B1 Progressive Overload-coach** — passer rehab-filosofien din som hånd i hanske.
