# Claude Code — Prompts for dashboard-forbedringer

Disse promptsene er klare til å kjøres én om gangen i Claude Code (`claude` i terminalen fra Dashboard-mappen).

---

## PROMPT 1 — B2/B3: Dobbelt-klikk guard på "Lagre økt" (gym.html + sprint.html)

```
I Dashboard-prosjektet (Vercel + Supabase, vanilla JS) må jeg fikse en bug i to filer:

**Problemet:** `saveLog()` i både `gym.html` og `sprint.html` mangler en guard mot dobbelt-klikk. Trykker brukeren to ganger raskt på "Lagre økt" lagres økten dobbelt i Supabase.

**Fix i gym.html:**
1. Legg til `let _isSavingLog = false;` øverst i script-blokken, nær de andre let-variablene.
2. I `async function saveLog()`: legg til `if (_isSavingLog) return; _isSavingLog = true;` helt øverst.
3. Wrap resten av funksjonen i try/finally og sett `_isSavingLog = false;` i finally-blokken.
4. Finn "Lagre økt"-knappen i HTML og sett `id="saveLogBtn"`.
5. Sett `document.getElementById('saveLogBtn').disabled = true;` etter guard, og `false` i finally.

**Fix i sprint.html:**
Samme mønster for `async function saveLog()` i sprint.html. Finn lagre-knappen (btn-success "Lagre økt") og legg til id="sprintSaveBtn". Samme disabled/enabled i try/finally.

Pass på at eksisterende logikk (toast, clearSession, clearDraft, loadGymHistory) ikke endres.
```

---

## PROMPT 2 — B4: Drag-reorder i gjøremål lagres i Supabase

```
I `gjoremal.html` (Dashboard, Vercel + Supabase, vanilla JS) lagres drag-rekkefølge kun i localStorage. Det betyr at rekkefølgen forsvinner på ny enhet/nettleser.

**Supabase-tabellen `todos` mangler en `sort_order`-kolonne. Legg den til:**

Kjør denne SQL-migrasjonen i Supabase SQL Editor (lagre den som `supabase/migrations/010_todos_sort_order.sql`):
```sql
ALTER TABLE todos ADD COLUMN IF NOT EXISTS sort_order integer;
UPDATE todos SET sort_order = id WHERE sort_order IS NULL;
```

**Deretter i gjoremal.html:**

1. Finn `function saveOrder(ln, ids)` — den lagrer kun til localStorage i dag.
2. Endre den til å OGSÅ oppdatere Supabase:
   - Iterer over `ids`-arrayen og kall `db.from('todos').update({ sort_order: index }).eq('id', ids[index])` for hver.
   - Bruk `Promise.all()` for å gjøre alle oppdateringer parallelt.
   - Behold localStorage-skrivingen som fallback (for umiddelbar respons).
3. I `loadTodos()`-funksjonen: endre `.order('due_date', ...)` til å først prøve `.order('sort_order', { ascending: true, nullsLast: true })`, og deretter `due_date` som sekundær sortering.
4. Når todos lastes inn, populer `_ord`-arrayen fra `sort_order`-verdiene i stedet for localStorage.

Pass på at funksjonen `renderTodos()` og filter-logikken ikke endres.
```

---

## PROMPT 3 — C1: Favicon + PWA manifest (alle HTML-filer)

```
I Dashboard-prosjektet (filip-vita.vercel.app) skal jeg legge til favicon og PWA-støtte slik at siden kan installeres som app på iPhone ("Legg til på hjemskjerm" fra Safari del-menyen).

**Det finnes allerede en PNG-fil jeg vil bruke som ikon** — men siden den ikke er lagt til ennå, lag et midlertidig SVG-favicon som en fil `favicon.svg` i rotmappen:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#0D0D10"/>
  <text y=".9em" font-size="90" x="5">📊</text>
</svg>
```

**Opprett `manifest.json` i rotmappen:**
```json
{
  "name": "Filip's Dashboard",
  "short_name": "Dashboard",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#050506",
  "theme_color": "#050506",
  "icons": [
    { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" }
  ]
}
```

**Legg til følgende `<head>`-tagger i ALLE disse filene** (ai.html, dashboard.html, gym.html, sprint.html, sovn.html, gjoremal.html, kalender.html, treningsplan.html, login.html) — rett etter `<meta name="viewport" ...>`:

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/favicon.svg">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#050506">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Dashboard">
```

**Oppdater `vercel.json`** — legg til headers for manifest:
```json
{
  "headers": [
    { "source": "/manifest.json", "headers": [{ "key": "Content-Type", "value": "application/manifest+json" }] }
  ]
}
```
(Behold eksisterende headers og rewrites i vercel.json, bare legg til dette.)
```

---

## PROMPT 4 — C2: Blandet tidslinje på Treningsoversikt (treningsplan.html)

```
I `treningsplan.html` (Dashboard, Vercel + Supabase, vanilla JS) vises kun styrkeøkter (gym_log) i øktloggen. Jeg vil ha en blandet tidslinje som viser BÅDE gym_log og sprint_log sortert etter dato, slik at jeg kan se knesmerte-mønstre på tvers av økttyper.

**Eksisterende kode:**
- `loadSessionHistory()` henter kun fra `gym_log` og `knee_pain`
- `renderSessionGrid()` rendrer kun gym-data
- Bruker sess-card/sess-detail drawer-mekanikk (klikk for å åpne detaljer)
- `_sessData`, `_kneeMap`, `_openDetail` er globale variabler

**Hva som skal gjøres:**

1. **Legg til ny global:** `let _sprintData = [];`

2. **Endre `loadSessionHistory()`:**
   - Hent OGSÅ fra `sprint_log`: `db.from('sprint_log').select('*').order('date', { ascending: false }).limit(30)`
   - Hent knee_pain for ALLE datoer (både gym og sprint)
   - Lagre sprint-data i `_sprintData`

3. **Endre `renderSessionGrid()`:**
   - Bygg en kombinert liste av objekter med type `'gym'` eller `'sprint'`
   - Sorter etter dato (nyeste først)
   - For gym-kort: vis eksisterende sess-card med session_type, knesmerte, notater
   - For sprint-kort: vis en badge "Sprint" (blå), vis løpsradene (distance + time), RPE, knesmerte
   - Begge typer bruker samme klikk-for-detalj-drawer mekanikk (`toggleSessionDetail`)

4. **Sprint-drawer skal inneholde:**
   - Løpsrader (distance, tid, type)
   - RPE-felt (redigerbart, lagres til sprint_log via `db.from('sprint_log').update`)
   - Knesmerte Før/Under/Etter/D.etter (redigerbart)
   - Notater (redigerbart)
   - Ingen slett-knapp (slett finnes på sprint.html)

5. **Gym-drawer:** behold eksisterende `buildDetailHtml()`-logikk uendret.

6. **Legg til visuell distinksjon:** gym-kort har grønn top-border (rgba(107,227,164,0.3)), sprint-kort har blå (rgba(91,164,245,0.3)).

Pass på at eksisterende `autoSaveSessionNotes`, `autoSaveKneePainField`, `toggleSessionDetail` fungerer for begge typer.
```

---

## PROMPT 5 — C3: AI-chat synk på tvers av enheter (Supabase)

```
I `ai.html` og `api/ai-chat.js` (Dashboard, Vercel + Supabase) lagres chat-historikken i localStorage. Jeg vil at den synkes til Supabase slik at samme samtale er tilgjengelig på Mac og iPhone.

**Opprett Supabase-migrasjonen** `supabase/migrations/011_ai_chat_history.sql`:
```sql
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own messages" ON ai_chat_history
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX ai_chat_history_user_created ON ai_chat_history(user_id, created_at DESC);
```

**Endre `ai.html`:**

1. **`saveHistory()`** — endre til å lagre til Supabase i stedet for localStorage:
   - Ta den siste meldingen (siste 2 elementer i chatHistory: user + assistant)
   - Insert begge til `ai_chat_history` med `user_id: session.user.id`
   - Behold localStorage som cache for rask lasting

2. **Init-blokken** — ved oppstart:
   - Prøv å laste siste 10 meldinger fra Supabase: `db.from('ai_chat_history').select('*').eq('user_id', uid).order('created_at', { ascending: true }).limit(20)`
   - Hvis Supabase returnerer data: bruk det (og oppdater localStorage-cache)
   - Fallback til localStorage hvis Supabase feiler

3. **`signOut()`** i utils.js sletter allerede `ai_chat_history` fra localStorage — det er greit å beholde.

4. **Legg til "Tøm samtale"-knapp** i chat-headeren (liten ghost-knapp ved siden av tittelen):
   - Sletter alle rader for bruker fra `ai_chat_history` i Supabase
   - Tømmer `chatHistory`-arrayen og DOM-en
   - Viser toast "Samtale tømt"

5. **Behold eksisterende `historyForApi()`-logikk** uendret — den sender maks 10 meldinger til Claude-API-et.

Pass på at `isSending`-guard ikke endres.
```

---

## PROMPT 6 — C4: Vercel rewrites for alle sider

```
I `vercel.json` (Dashboard-rot) finnes kun rewrites for `/` og `/sovn`. Legg til rewrites for alle sider slik at URL-ene fungerer uten `.html`:

```json
{
  "rewrites": [
    { "source": "/",                "destination": "/dashboard.html" },
    { "source": "/dashboard",       "destination": "/dashboard.html" },
    { "source": "/gym",             "destination": "/gym.html" },
    { "source": "/sprint",          "destination": "/sprint.html" },
    { "source": "/sovn",            "destination": "/sovn.html" },
    { "source": "/gjoremal",        "destination": "/gjoremal.html" },
    { "source": "/kalender",        "destination": "/kalender.html" },
    { "source": "/treningsplan",    "destination": "/treningsplan.html" },
    { "source": "/ai",              "destination": "/ai.html" },
    { "source": "/login",           "destination": "/login.html" }
  ]
}
```

Behold eksisterende `headers`-blokk og `crons`-blokk uendret. Bare erstatt/utvid `rewrites`-arrayen.

OBS: Ikke endre filnavn på .html-filene — bare legg til disse URL-mappingene.
```

---

## PROMPT 7 — C6: Slett-knapp på feilloggede gym-økter

```
I `gym.html` (Dashboard) vises gym-historikken i en sidebar. Brukeren kan i dag ikke slette en feillogget økt direkte fra dashboardet — det må gjøres manuelt i Supabase.

**Legg til slett-funksjonalitet på gym-historikk-kortene:**

1. Finn `loadGymHistory()`-funksjonen og `renderGymHistory()`-funksjonen (eller der gym-historikk rendres i sidebar/historikk-seksjon).

2. Legg til en slett-knapp på hvert historikk-kort — samme stil som `.btn-del-session` i sprint.html:
```css
.gym-del-btn {
  background: none; border: none; color: var(--text-tertiary);
  cursor: pointer; font-size: 11px; opacity: 0;
  transition: opacity 0.15s, color 0.15s; padding: 2px 4px;
}
.gym-history-item:hover .gym-del-btn { opacity: 1; }
.gym-del-btn:hover { color: var(--danger); }
```

3. **`deleteGymSession(gymId, kneePainId)`:**
```js
async function deleteGymSession(gymId, kneePainId) {
  if (!confirm('Slett denne økten?')) return;
  const ops = [db.from('gym_log').delete().eq('id', gymId)];
  if (kneePainId) ops.push(db.from('knee_pain').delete().eq('id', kneePainId));
  const results = await Promise.all(ops);
  if (results.some(r => r.error)) { toast('Feil ved sletting', 'err'); return; }
  toast('Økt slettet');
  await loadGymHistory();
}
```

4. Sletter BÅDE `gym_log`-raden OG tilhørende `knee_pain`-rad (kobles via `date + session_type`).

5. Legg til knappen i historikk-item-HTML-en med `onclick="deleteGymSession('${g.id}', '${knee?.id || ''}')"`.

Pass på at eksisterende historikk-rendering og treningsplan-logikk ikke endres.
```

---

## NB: Rekkefølge å kjøre i

1. **Prompt 6** (vercel.json) — rask og risikofri
2. **Prompt 1** (dobbelt-klikk guard) — rask og isolert  
3. **Prompt 3** (favicon/PWA) — rask, men husk å bytte ut SVG-favicon med PNG-logoen etterpå
4. **Prompt 7** (slett gym-økt) — moderat
5. **Prompt 4** (blandet tidslinje) — kompleks, test grundig
6. **Prompt 2** (drag sort_order) — krever SQL-migrasjon i Supabase først
7. **Prompt 5** (AI-chat synk) — krever SQL-migrasjon + backend-endringer, test på begge enheter

