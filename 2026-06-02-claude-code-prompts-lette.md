# Claude Code-prompts — lette oppgaver (2026-06-02)

Lim disse inn i Claude Code **én om gangen**, i mappa `Dashboard`. Claude Code
leser `CLAUDE.md` automatisk, men hver prompt minner den likevel på i18n-reglene.

> Tips: Hvis Claude Code-sesjonen har vært åpen lenge, skriv `/clear` før du
> limer inn neste prompt, så den har fersk kontekst.

---

## 0 — Git-lås (gjør denne FØRST, så du kan pushe igjen)

```
Git nekter å committe/pushe med feilen "Unable to create '.git/index.lock':
File exists". Det er en etterlatt låsefil fra en git-prosess som krasjet.
Slett den med:

    rm -f .git/index.lock

Bekreft deretter at `git status` kjører uten feil. Ikke rør noe annet i .git.
```

---

## A2 — Basketball-knappen mangler oversettelse

```
Følg i18n-reglene i CLAUDE.md (all synlig tekst MÅ være tospråklig via
data-i18n / t(), og nøkkelen MÅ legges i BÅDE TRANSLATIONS.no og
TRANSLATIONS.en i utils.js med likt antall nøkler).

I treningsplan.html, linje ~592, har Basketball-knappen ingen data-i18n:

    <button class="act-type-btn" data-type="Basketball" onclick="selectActType(this)">Basketball</button>

1. Legg på data-i18n="tp.act_basketball" (behold data-type="Basketball" uendret
   — den brukes som datalagrings-verdi og skal IKKE oversettes).
2. Legg nøkkelen tp.act_basketball i begge språk i utils.js
   (no: "Basketball", en: "Basketball").
3. Sjekk de andre act-type-btn-knappene i samme blokk — hvis noen av dem også
   mangler data-i18n, fiks dem på samme måte med tp.act_*-nøkler.

Verifiser til slutt:
- node --check utils.js
- at no og en har likt antall nøkler (kommandoen står i CLAUDE.md).
```

---

## A7 — Språk resettes til norsk ved refresh

```
Følg i18n-reglene i CLAUDE.md.

Bug: når jeg bytter til engelsk (🇺🇸) og så refresher siden, går deler av
appen tilbake til norsk. Språket lagres i localStorage('lang') og leses i
utils.js (let _lang = localStorage.getItem('lang') || 'no'), så lagringen
fungerer — problemet er i hvordan sidene anvender språket ved last.

Undersøk og fiks:
1. Gå gjennom HVER side (.html). De fleste kaller applyLang() inne i en async
   init-funksjon som kjører ETTER at DOM males, så brukeren ser et glimt av
   norsk eller JS-generert tekst blir stående på norsk. Sørg for at applyLang()
   kjøres så tidlig som mulig ved last (og at JS-generert tekst rendres via t()).
2. login.html kaller applyLang() men mangler en onLangChange-handler — sjekk om
   det forårsaker problemet der.
3. Sjekk særlig sider der dynamisk/JS-generert tekst IKKE re-rendres med riktig
   språk ved last (sammenlign med onLangChange-mønsteret som beskrevet i
   CLAUDE.md punkt 5).

Test grundig i nettleser: sett engelsk, refresh hver side, let etter norsk
tekst som lekker. Gjør så samme test motsatt vei (norsk satt, refresh).

Verifiser: node --check på endret JS, og no=en antall nøkler.
```

---

## B8 — Kontrast-opprydding (lesbarhet)

```
Følg i18n-reglene i CLAUDE.md (ikke endre tekstinnhold, kun stil).

Enkelte grå tekster og kantlinjer er nesten usynlige. Rydd opp i kontrast UTEN
å innføre lyst tema — behold mørkt tema, bare gjør svak tekst mer lesbar:

1. I styles.css er --text-tertiary: #76746E. Den brukes til labels og
   metadata. Hev den litt (f.eks. mot #8E8C85) så små tekster blir lesbare,
   men fortsatt tydelig sekundære.
2. Søk etter tekst/elementer med veldig lav opacity (under ~0.15), f.eks.
   rgba(255,255,255,0.11) i kalender.html (linje ~187, månedstall) og
   dashboard.html (linje ~244). Hev kontrasten på tekst som er ment å leses
   (ikke nødvendigvis rene dekor-kantlinjer).
3. Behold fargepaletten og det generelle uttrykket — dette er en finpuss, ikke
   en redesign.

Test i nettleser at småtekst nå er lesbar på begge språk. Ingen funksjonell
endring.
```

---

## B4 — PB-er: redigerbart tall + "reset baseline"

```
Følg i18n-reglene i CLAUDE.md NØYE: all synlig tekst tospråklig via t()/
data-i18n, nøkler i BÅDE TRANSLATIONS.no og TRANSLATIONS.en i utils.js med
likt antall nøkler. Dynamisk innhold må re-rendres ved språkbytte (onLangChange).

Kontekst (sprint.html):
- PB-er ligger i Supabase-tabellen sprint_records (distance PK, best_time, date).
- loadPBs() rendrer PB-board i #pbGrid for distansene 60m, 60m_celler, 100m, 200m.
  (Merk: 60m_celler regnes LIVE fra sprint_log og skal IKKE være manuelt
  redigerbar — hopp over den.)
- Måling av målprogresjon: GOALS-arrayet har { dist, goal, start, color }, og
  renderSprintGoals() regner pct = (start - pb) / (start - goal) * 100.
  "start" er baseline (utgangspunktet) for progresjonsbaren.

Jeg vil IKKE ha en stevne-modul. Jeg vil:

1. Kunne REDIGERE best_time (og evt. dato) manuelt på eksisterende PB-er for
   60m, 100m, 200m. Legg en liten rediger-knapp/inline-input per pb-cell som
   skriver til sprint_records via upsert. Valider at tallet er et positivt
   sekundtall.

2. En "Reset baseline"-knapp per distanse som har et mål (100m, 200m): den skal
   sette progresjonsbarens utgangspunkt (start) til NÅVÆRENDE PB, slik at baren
   regnes på nytt fra dagens nivå. PB-tallet skal BEHOLDES — det er kun
   baseline/start som nullstilles til nåværende PB.
   - Fordi GOALS i dag er hardkodet, må "start" nå kunne overstyres per bruker.
     Lagre den overstyrte baselinen (f.eks. ny kolonne baseline_time i
     sprint_records, eller en egen liten tabell sprint_goal_baseline). Lag en
     SQL-migrasjon i supabase/migrations/ for dette (neste ledige nummer).
     Vis meg migrasjonsfila før du forventer at jeg kjører den i Supabase.
   - renderSprintGoals() må bruke den overstyrte baselinen hvis den finnes,
     ellers falle tilbake til GOALS.start.

3. BONUS-bug du skal fikse samtidig: i renderSprintGoals() er deltaStr
   hardkodet norsk ("✓ Mål nådd!" og "Xs fra mål"). Legg disse i t()-nøkler
   (sprint.goal_reached og sprint.from_goal med variabel) i begge språk.

Verifiser:
- node --check på endret JS, no=en antall nøkler.
- Test i nettleser på BEGGE språk: rediger en PB, reset baseline, sjekk at
  baren oppdateres og at ingen norsk tekst lekker i engelsk modus.

Til slutt: list alle filer du endret/opprettet med plassering.
```

---

### Rekkefølge
1. **0 (git-lås)** — så du kan pushe igjen.
2. A2, A7, B8 — rene småfikser, rask å verifisere.
3. B4 — størst av de lette (DB-migrasjon + UI). Ta den sist.

De STORE oppgavene (A6 redigerbare gym-dager, B1 progressive overload, B2 RPE
1–100, B3 kne-dashboard, B5 ukentlig oppsummering, B6 smartere AI, B7 PDF)
bygger Claude (Cowork) direkte i filene — du committer/pusher.
