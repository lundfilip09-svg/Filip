# iOS Snarvei: Søvn & Hvilepuls → Dashboard

Denne snarveien henter søvntimer og hvilepuls fra Apple Helse og sender det automatisk til dashboardet ditt hver morgen kl. 06:00.

---

## Del 1 — Lag snarveien

Åpne **Snarveier**-appen på iPhone.

Trykk **+** øverst til høyre for å lage en ny snarvei. Gi den navnet **"Søvn & Hvilepuls"**.

---

### Steg 1 — Hent søvnperioder

Trykk **Legg til handling** → søk etter **"Finn helseeksempler"**.

Konfigurer slik:
- Type: **Søvnanalyse**
- Sorter etter: **Startdato** (nyeste først)
- Begrens: **20** (fanger opp alle perioder fra natten)
- Filtrer: **Startdato** → **er etter** → **Gårsdagens dato kl. 20:00**

---

### Steg 2 — Summer søvntid i sekunder

Trykk **Legg til handling** → **Gjenta med hvert element** (velg listen fra steg 1).

Inne i løkken:

1. Legg til **"Hent detaljer om helseeksempel"** → velg **Sluttdato**. Lagre i variabel: `SluttSek`
2. Legg til **"Hent detaljer om helseeksempel"** → velg **Startdato**. Lagre i variabel: `StartSek`
3. Legg til **"Beregn"**: `SluttSek` **−** `StartSek`. Lagre i variabel: `VarSek`
4. Legg til **"Legg til i variabel"**: legg `VarSek` til variabel `TotalSek`

> Merk: Dates i Snarveier er i sekunder siden 2001-01-01 under panseret. Subtraksjonen gir antall sekunder søvn per periode.

---

### Steg 3 — Konverter til timer

Legg til **"Beregn"**: `TotalSek` **÷** **3600**

Lagre resultatet i variabel: `SøvnTimer`

Legg til **"Rund av"**: `SøvnTimer` → **2 desimaler**. Lagre som `SøvnTimer`.

---

### Steg 4 — Hent hvilepuls

Legg til **"Finn helseeksempler"**:
- Type: **Hvilepuls**
- Sorter etter: **Startdato** (nyeste først)
- Begrens: **1**

Legg til **"Hent detaljer om helseeksempel"** → velg **Verdi**. Lagre som `Hvilepuls`.

---

### Steg 5 — Send til dashboardet

Legg til **"Hent innhold fra URL"**:
- URL: `https://filip-vita.vercel.app/api/zepp-data`
- Metode: **POST**
- Overskrifter: `Content-Type` = `application/json`
- Forespørselstekst: **JSON**
  - Legg til nøkkel: `sleepHours` = `SøvnTimer` (variabelen fra steg 3)
  - Legg til nøkkel: `rhr` = `Hvilepuls` (variabelen fra steg 4)

---

### Steg 6 — Bekreftelse (valgfritt)

Legg til **"Vis varsel"**: tekst `Data sendt ✓`

---

## Del 2 — Automatiser (kjør uten å trykke)

1. Åpne **Snarveier** → velg fanen **Automasjon** nederst
2. Trykk **+** → **Personlig automasjon**
3. Velg **Klokkeslett** → sett **06:00**, **Daglig**
4. Trykk **Neste** → **Legg til handling** → **Kjør snarvei** → velg **"Søvn & Hvilepuls"**
5. Skru AV **"Spør før kjøring"** (viktig — ellers vekker den deg med et varsel)
6. Trykk **Ferdig**

Ferdig. Snarveien kjører nå automatisk hver morgen kl. 06:00 og sender data til dashboardet uten at du gjør noe.

---

## Feilsøking

**Søvntimer er 0 eller null:** Sørg for at Zepp-appen har tilgang til å skrive til Apple Helse. Gå til Innstillinger → Personvern → Helse → Zepp → slå på **Søvnanalyse**.

**Hvilepuls er null:** Zepp-appen syncer hvilepuls til Helse. Sjekk at **Hvilepuls** er aktivert i Zepp → Helse-tilkoblinger.

**Feilen "routes not found":** Sjekk at Vercel har miljøvariablene `SUPABASE_URL` og `SUPABASE_ANON_KEY` satt under filip-vita → Settings → Environment Variables.
