# Dashboard-revisjon — 2026-06-21 (read-only)

Omfang: alle `.html`, `utils.js`, `styles.css`, `sw.js`, `api/`. Ingen endringer gjort.

## Sammendrag (ærlig kalibrering)
Kodebasen er ryddigere enn forventet. Verifisert programmatisk:
- **i18n: perfekt paritet** — 941 nøkler i både `no` og `en`, ingen manglende. Alle dynamiske nøkler (`wd.0–6`, `side.left/right/both/none`, `knee.*`) resolver.
- **Ingen udefinerte funksjoner** kalt fra `onclick`/`oninput` osv. (sjekket alle inline-handlere mot utils.js + lokale defs).
- **Lese-spørringer er konsekvent guardet** med `data || []` → ingen `.map`/`.forEach`-krasj på null.

Derfor: **ingen krasj-/datatap-CRITICAL funnet.** De mest alvorlige reelle problemene ligger på HIGH (mobil-UX på iPhone + stille feil som skjuler data). Ikke inflatert.

Forbehold: dette er statisk analyse, ikke runtime-testing. Jeg har ikke kjørt appen i nettleser eller mot live Supabase.

---

## CRITICAL
Ingen. (Ingen udefinerte funksjoner, ingen i18n-hull, ingen null-krasj-mønstre, ingen åpenbar datatap-bug.)

---

## HIGH

**iOS auto-zoom på alle skjemafelt** — `styles.css:298` — `input,select,textarea` har `font-size: 13px`. Safari på iPhone zoomer automatisk inn når du fokuserer et felt < 16px. Hele appen er bygd for telefonbruk (gym-logging), så dette treffer hver eneste input på din iPhone 13 Pro Max. Fix: 16px på mobil-breakpoint.

**Touch-mål under 44px på primærknapper** — `styles.css:274` (`.btn` ~31px høy), `289` (`.btn-sm`), `290` (`.btn-xs`), `291` (`.btn-icon` 28×28px). Apples HIG = min 44×44px. Sett-logging, slett-/rediger-ikoner og småknapper er for små for tommel på trening. `nav-tab` (54px, `styles.css:101`) er derimot fin.

**Lesefeil vises som "tomme data"** — `sprint.html:386,546`, `dashboard.html:709/834`, mønster i alle sider — `const { data } = await db.from(...)` sjekker aldri `error`, kun `data || []`. Nettverksfeil/RLS-avvisning gir tom liste i stedet for feilmelding. For en helse-app betyr det at en mislykket henting ser identisk ut med "ingen smerte/økter logget". Skriv-spørringer toaster feil korrekt — kun lesninger mangler det.

**`api/ai-chat.js` mangler topp-nivå try/catch** — `api/ai-chat.js:12` (handler) — hvis `buildAiContext()` eller `fetch` kaster (ikke `!ok`, men throw på nettverk/parse), er det ingen catch → Vercel returnerer ugjennomsiktig 500 og chatten henger uten feilmelding. `weekly-summary.js` bør sjekkes likt.

---

## MEDIUM

**Dobbel henting av injury_pain + knee_pain ved dashboard-load** — `dashboard.html:730` (`loadInjuryCards`) og `dashboard.html:868` (`loadLoadPain`) — begge gjør `Promise.all([ipFetch, knFetch])` på samme sidelasting. Samme to tabeller hentes to ganger parallelt. Del resultatet.

**Språkbytte refetcher fra DB i stedet for å re-rendre** — `dashboard.html:1640` (`onLangChange`) kaller `loadSleep()`, `loadTodos()`, `loadCalendar()`, `renderWeekStrip()` på nytt — nye nettverksrunder bare for å bytte språk på allerede-hentet data. Cache data og re-rendr lokalt.

**Modaler/drawere har ingen transition** — `gym.html:62` (`.day-dialog-backdrop.open { display:flex }`), `gym.html:252` (`.set-drawer.open { display:block }`), + ~35 `display`-toggles totalt. Rene `display:none ↔ flex/block`-bytter popper inn uten fade/slide. Du flagget selv smoothness — dette er den største kilden. (Toast på `styles.css:451` gjør det riktig med transform+opacity.)

**Duplisert i18n-system i `treningsdagbok.html`** — `treningsdagbok.html:161` definerer sin egen `TR`/`t()` i stedet for utils.js' `TRANSLATIONS`. To oversettelsestabeller som kan drifte fra hverandre. Siden er precachet i `sw.js:21` men ikke lenket i nav — bekreft at den fortsatt brukes.

**`Access-Control-Allow-Origin: *` på AI-endepunkt** — `api/ai-chat.js:13` — hvilken som helst nettside kan kalle endepunktet. Auth-token kreves (begrenser skaden), men CORS bør låses til ditt eget domene så fremmede sider ikke kan trigge Anthropic-kall i din nettleser-sesjon.

---

## LOW

**Død fil: `kalender-widget.html`** — ikke lenket fra noen side/js og ikke i `sw.js` SHELL. Trygt å slette (men bekreft først per din egen regel).

**`:active`-feedback mangler på mange touch-elementer** — `styles.css` har 23 `:hover` mot kun 14 `:active`. På iOS gjør `:hover` ingenting (eller blir "klistrende"); knapper uten `:active` gir ingen trykk-respons. Legg `:active { transform: scale(.97) }` e.l. på `.btn`, `.nav-tab`, sett-rader.

**`transition: all 0.15s` på `.btn`** — `styles.css:276` — `all` kan animere layout-egenskaper (padding, border, width) og trigge reflow. Spesifiser `transition: background, border-color, transform`.

**Uendelig bakgrunns-animasjon uten reduced-motion-guard for hele effekten** — `styles.css:55` (`animation: wash 36s infinite`) på `body::before`. `nav-tab-dot` respekterer `prefers-reduced-motion` (`styles.css:130`), men `wash`-animasjonen gjør ikke — kontinuerlig GPU/batteri-bruk på telefon. Legg den under samme media-query.

**Manglende bunn-safe-area** — `styles.css:451` (toast `bottom:24px`) og evt. andre bunn-fikserte elementer bruker ikke `env(safe-area-inset-bottom)`. Kun toppen er håndtert (`styles.css:77`). På iPhone med home-indicator kan bunn-elementer havne for nær kanten.

**97 `getElementById(...).value` uten `?.`** (mot 27 med `?.`) — `*.html` — fungerer så lenge elementet alltid finnes, men er skjørt ved fremtidig markup-endring. Ikke en bug nå; et robusthet-mønster å stramme inn.

---

## Ikke funnet (positivt verifisert)
- i18n-nøkkelhull: ingen.
- Udefinerte funksjoner i handlere: ingen.
- Null-krasj på lese-data: ingen (alle `|| []`).
- `loadTodos`-race ved init er allerede fikset (`dashboard.html:1614`, kommentar #13).
- Auth verifiseres i `ai-chat.js:43` før Anthropic-kall.
