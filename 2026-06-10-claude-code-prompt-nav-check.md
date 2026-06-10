# Claude Code-prompt: #10 — nav-drift-sjekk (forhindre at nav lekker)

**Kontekst:** Nav-en (`<nav class="main-nav">`) er kopiert manuelt inn i 8 HTML-filer.
Det førte til en bug der PDF-lenken bare lå på én side. Naviene er synket nå, men jeg
vil forhindre fremtidig drift.

**IKKE bygg nav-en med JS (runtime-injeksjon).** Grunn: `utils.js` lastes *nederst* på
hver side, og aktiv fane settes per side med
`document.querySelector('[data-p="…"]').classList.add('active')`. En JS-injisert nav
ville gjort navigasjonen avhengig av at JS lastes (blink/feil) og er vanskelig å teste.
Behold statisk HTML — lag en sjekk som fanger drift i stedet.

## Oppgave

1. **Lag `scripts/check-nav.mjs`** (Node, ingen avhengigheter). For hver av disse 8 filene:
   `ai.html, dashboard.html, gym.html, sprint.html, sovn.html, gjoremal.html,
   kalender.html, treningsplan.html`:
   - Hent ut `<nav class="main-nav"> … </nav>`-blokken.
   - Sjekk at blokken inneholder alle:
     - 8 nav-lenker med `data-p="…"`: `ai, dashboard, gym, sprint, sovn, gjoremal,
       kalender, treningsplan`
     - PDF-lenken: `id="diaryLink"` med `href="treningsdagbok.html"`
     - Språkknappen: `id="langBtn"`
     - Logg ut: `onclick="signOut()"`
   - Mangler noe: skriv ut **hvilken fil + hva som mangler**, avslutt med exit-kode 1.
     Ellers skriv «nav OK» og exit 0.

2. **Lag GitHub Action `.github/workflows/2026-06-10-nav-check.yml`** som kjører på
   `push` og `pull_request`: checkout → setup-node → `node scripts/check-nav.mjs`.

3. **Legg til npm-script** `"check:nav": "node scripts/check-nav.mjs"` i `package.json`.

4. **Verifiser:** kjør scriptet (skal si «nav OK»). Fjern så midlertidig `diaryLink`-linja
   fra én fil og kjør igjen (skal feile og navngi fila). Gjenopprett fila etterpå.

## Regler (fra CLAUDE.md)
- Bekreft før du overskriver eksisterende filer; ikke rør filer utenfor mappa.
- `scripts/check-nav.mjs` får konvensjonelt navn (refereres av CI/npm) — resten følger
  datonavngiving.
- List endrede/opprettede filer til slutt.
