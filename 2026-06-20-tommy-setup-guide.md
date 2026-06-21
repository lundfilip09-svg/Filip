# 🛠️ Setup-guide — Personal Dashboard

Dette er alt du må gjøre selv før KI-en kan bygge dashboardet ditt.
Følg stegene i rekkefølge. Hvert steg lenker til riktig side.

---

## Steg 1 — GitHub-konto

**Hva:** Koden din må ligge et sted. Vercel (hosting) henter koden herfra automatisk.

1. Gå til [github.com](https://github.com) → lag konto
2. Lag et nytt **private** repository, kall det f.eks. `dashboard`
3. Last ned [GitHub Desktop](https://desktop.github.com) (enklest) eller bruk terminalen

---

## Steg 2 — Supabase (database)

**Hva:** Supabase er databasen — her lagres søvn, treninger, gjøremål osv.

1. Gå til [supabase.com](https://supabase.com) → "Start your project" → logg inn med GitHub
2. Lag et nytt prosjekt
   - Velg region: **West EU (Ireland)** eller nærmest deg
   - Skriv ned databasepassordet et trygt sted
3. Når prosjektet er oppe, gå til **Settings → API**
4. Kopier og lagre disse tre verdiene (du trenger dem i Steg 5):
   - `Project URL`
   - `anon / public` nøkkel
   - `service_role` nøkkel ⚠️ denne er hemmelig, ikke del den

> KI-en vil lage SQL-migrasjoner for deg. Du kjører dem under **SQL Editor** i Supabase-dashboardet.

---

## Steg 3 — Vercel (hosting)

**Hva:** Vercel gjør koden din om til en live nettside — gratis for personlig bruk.

1. Gå til [vercel.com](https://vercel.com) → "Sign Up" med GitHub
2. Klikk **"Add New Project"** → velg ditt GitHub-repo
3. La alle innstillinger stå på default → klikk **Deploy**

Nettadressen din blir noe som `dashboard-xyz.vercel.app` (du kan koble til eget domene senere).

---

## Steg 4 — Miljøvariabler i Vercel

**Hva:** Hemmelige nøkler (Supabase, AI, osv.) legges inn her — aldri rett i koden.

I Vercel-prosjektet ditt → **Settings → Environment Variables** → legg til:

| Variabel | Verdi |
|---|---|
| `SUPABASE_URL` | Project URL fra Steg 2 |
| `SUPABASE_ANON_KEY` | anon-nøkkel fra Steg 2 |
| `SUPABASE_SERVICE_KEY` | service_role-nøkkel fra Steg 2 |
| `OPENAI_API_KEY` | Se Steg 6 |
| `WEBHOOK_SECRET` | Finn på en lang tilfeldig streng selv, f.eks. `mitt-hemmelige-passord-123` |

Etter du legger til variabler → klikk **Redeploy** for at de skal tre i kraft.

---

## Steg 5 — OpenAI API-nøkkel (for AI-chatten)

**Hva:** AI-assistenten i dashboardet bruker GPT-4o. Du trenger en API-nøkkel.

1. Gå til [platform.openai.com](https://platform.openai.com) → logg inn / lag konto
2. Gå til **API Keys** → "Create new secret key"
3. Kopier nøkkelen og lim inn som `OPENAI_API_KEY` i Vercel (Steg 4)

> ⚠️ OpenAI koster litt penger per bruk, men for personlig bruk er det noen få kroner i måneden. Sett et budsjettvarsel under **Billing → Usage limits**.

---

## Steg 6 — Apple Watch-integrasjon (valgfritt, men anbefalt)

**Hva:** Apple Watch sender søvndata automatisk til dashboardet ditt via en Snarvei.

### 6a — Webhook-URL
Etter Vercel-deploy vil webhook-endepunktet ditt være:
```
https://ditt-prosjekt.vercel.app/api/apple-watch-webhook
```

### 6b — Lag en Snarvei på iPhone
1. Åpne **Snarveier**-appen
2. Lag en ny snarvei med disse stegene:
   - **"Hent helsedata"** → Søvnanalyse (eller Sleep Score fra tredjepartsapp)
   - Eventuelt: HRV (Heart Rate Variability) og Hvilepuls
   - **"Hent innhold fra URL"** (POST-forespørsel):
     - URL: `https://ditt-prosjekt.vercel.app/api/apple-watch-webhook`
     - Metode: `POST`
     - Header: `x-webhook-secret` = den tilfeldige strengen du valgte i Steg 4
     - Body (JSON):
       ```json
       {
         "date": "DATO",
         "sleep_score": SØVNSCORE,
         "duration_hours": VARIGHET,
         "hrv": HRV,
         "rhr": HVILEPULS
       }
       ```
3. Sett snarveien til å kjøre **automatisk hver morgen** (f.eks. kl. 08:00) via **Automatisering**

> Tips: Apper som **AutoSleep**, **Sleep Cycle** eller **Pillow** gir bedre søvnscoring enn Apples innebygde. Disse eksponerer data i Helse-appen som Snarveier kan lese.

---

## Steg 7 — QStash (valgfritt — for planlagte oppgaver)

**Hva:** QStash fra Upstash er en meldingskø for å kjøre ting på et bestemt tidspunkt (f.eks. sende deg en ukentlig rapport). Du trenger dette bare hvis du vil ha automatiserte funksjoner utover Apple Watch-webhooket.

1. Gå til [upstash.com](https://upstash.com) → lag konto
2. Gå til **QStash** → kopier `QSTASH_TOKEN`
3. Legg til i Vercel som `QSTASH_TOKEN`
4. Si til KI-en at du vil bruke QStash og beskriv hva du vil automatisere

---

## Steg 8 — Kjør SQL-migrasjoner

Når KI-en har laget SQL-filene (i `supabase/migrations/`):

1. Gå til [supabase.com](https://supabase.com) → ditt prosjekt → **SQL Editor**
2. Kopier innholdet i hver migrasjonsfil (i rekkefølge, starter på 001)
3. Lim inn og klikk **Run**
4. Gjenta for alle filer

> KI-en vil gi deg ferdig SQL. Du trenger ikke forstå den, bare kjøre den i riktig rekkefølge.

---

## Steg 9 — Test at alt funker

1. Gå til `https://ditt-prosjekt.vercel.app/login.html`
2. Opprett bruker via Supabase: **Authentication → Users → Invite user** (skriv inn din e-post)
3. Logg inn → verifiser at dashboard laster
4. Logg en treningsøkt i `gym.html` og sjekk at den dukker opp

---

## Oppsummering — hva KI-en gjør for deg

| Du gjør selv | KI-en (ChatGPT Codex) gjør |
|---|---|
| GitHub-konto og repo | All koden |
| Supabase-prosjekt | SQL-migrasjoner |
| Vercel-deploy | API-funksjoner |
| Legge inn miljøvariabler | Apple Watch-webhook |
| Kjøre SQL i Supabase | AI-chat-integrasjon |
| Sette opp Apple Shortcut | Alt annet |

---

## Nyttige lenker

- [github.com](https://github.com)
- [supabase.com](https://supabase.com)
- [vercel.com](https://vercel.com)
- [platform.openai.com](https://platform.openai.com)
- [upstash.com](https://upstash.com) (QStash)
- [AutoSleep-appen](https://apps.apple.com/app/autosleep-track-sleep-on-watch/id1164801111) (anbefalt for Apple Watch søvndata)
