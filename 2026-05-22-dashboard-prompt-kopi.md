# Athlete Dashboard — Claude Code Prompt

Build a single self-contained HTML file called `dashboard.html`, plus a Netlify project structure with two serverless functions. The HTML file works locally via VS Code Live Server. Deployed to Netlify it gains live data from Zepp and Google Calendar via serverless functions.

**Project structure expected:**
```
dashboard.html
netlify.toml
netlify/functions/
  zepp-data.js
  google-calendar.js
```

The HTML file has all styles inline in `<style>` and all JavaScript inline in one `<script>` tag at the bottom. No npm, no build step, no external CSS or JS files.

The file has these components stacked vertically in a single-column layout (max-width 1100px, centered):

1. Page title
2. Goal Ticker strip
3. Day Ring + Today's Session (side by side on desktop, stacked on mobile)
4. Injury Status card
5. Recovery & Sleep card
6. Sprint PB Board
7. Weekly Schedule
8. Strength Plan
9. To Do List

---

## Visual style (whole file)

**Identical to the reference — do not deviate.**

- Dark theme. Page background `#050506` with two soft radial washes layered on top: a warm orange wash `rgba(224, 118, 88, 0.16)` at 82% across / 14% down, and a cool grey wash `rgba(180, 180, 200, 0.06)` at 18% across / 90% down. Both blurred 40px and slowly drifting via a 36s alternating animation.
- A second `body::after` layer adds a tiny film-grain dot pattern (3px × 3px tile, white at ~1.4% opacity) so the dark never looks plastic.
- Body font: `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Mono font: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`.
- CSS variables: `--text-primary: #FAFAFA`, `--text-secondary: #B8B6B0`, `--text-tertiary: #76746E`.
- Semantic colors: `--success: #6BE3A4`, `--warning: #F2C063`, `--danger: #FF6B6B`, `--accent-blue: #5BA4F5`.
- Card chassis: `rgba(255,255,255,0.04)` background, no visible border, 16px radius, 18–22px padding, `backdrop-filter: blur(24px) saturate(1.2)`, shadow `0 12px 40px rgba(0,0,0,0.45)`.
- Body centered, max-width 1100px, safe-area-aware top padding. 20px gap between all major components.
- Section eyebrows use `.section-title` — 10.5px, weight 700, 0.18em letter-spacing, uppercase, `--text-tertiary`. A short `::before` dash (18px wide, 1px tall) and a fading `::after` line (flex 1, gradient to transparent) flank the text.

---

## Component 1 — Page title

`<h1 class="dash-title">Filip's Dashboard</h1>` at the very top.

- `font-size: 28px`, `font-weight: 700`, `letter-spacing: -0.025em`.
- Gradient text: `background: linear-gradient(180deg, #FFFFFF 0%, #C7C4BC 120%)`, then `-webkit-background-clip: text; -webkit-text-fill-color: transparent;`.
- 14px bottom margin.
- ≤ 480px: `font-size: 22px`.

---

## Component 2 — Goal Ticker

**Identical to the reference spec.** Strip below the title that cycles through today's pending goals every 5 seconds with vertical slide animations. Reads the same `goals:YYYY-MM-DD` localStorage key as the To Do List. Green pulsing LED dot, `GOALS` label, pending goal text in mono, `done/total` pill on the right. Fires `goals-changed` custom event on any list edit; ticker resets immediately.

---

## Component 3 — Day Ring + Today's Session

A two-column flex row: Day Ring on the left, Today's Session card on the right. On screens ≤ 640px they stack vertically, full width each.

### Day Ring (left)
**Identical to the reference spec.** 168×168px SVG ring, awake window 8 AM–midnight (16 hours = 100%). Sun-cycle palette, phase labels, live clock. Shrinks to 144×144 on mobile.

### Today's Session card (right, flex: 1)

Displays the scheduled training session for today based on the day of the week and the `weekly_plan` stored in localStorage.

**Header row:**
- Left: section eyebrow `Today's session`, below it the session type as a large badge pill (e.g. `SPRINT`, `STYRKE`, `REHAB`, `REST`, `MOBILITET`). Badge background is color-coded: Sprint = `rgba(91,164,245,0.15)` with `#5BA4F5` text; Styrke = `rgba(242,192,99,0.15)` with `#F2C063` text; Rehab/Mobilitet = `rgba(107,227,164,0.15)` with `#6BE3A4` text; Rest = `rgba(255,255,255,0.06)` with `--text-tertiary` text.
- Right: RPE target badge (e.g. `RPE 7–8`) — 11px mono, `rgba(255,255,255,0.06)` pill.

**Session body:**
- A short description line (e.g. `Acceleration work + flying 60s`) — 13px, `--text-secondary`.
- A key exercises list — max 4 items, each on one line, 11px mono, `--text-tertiary`. Bullet: a thin right-pointing chevron `›` in `--success` color.
- A "knee note" line if today is a sprint or strength day: `⚠ Log kne-smerte i SPRINT-LOG etter økt` — 10px, `--warning`, italic. Always visible on sprint/strength days.

**Quick log row** at the bottom of the card:
- Label: `Kne-smerte nå (0–10)` — 10px tertiary.
- A row of 11 small square buttons labeled `0` through `10`. Selected button fills with a color that interpolates: 0–3 = `#6BE3A4`, 4–5 = `#F2C063`, 6–7 = `rgba(242,130,60,1)`, 8–10 = `#FF6B6B`. Unselected: `rgba(255,255,255,0.04)`, 1px border. On click: save `{ date, score, sessionType }` to `injury_log` in localStorage, update the Injury Status card immediately via a custom event `injury-logged`.
- On ≤ 480px: buttons wrap, smaller size.

**Default weekly plan** (used if no `weekly_plan` key in localStorage):
```json
{
  "monday":    { "type": "STYRKE",   "label": "Styrke kapasitet bein",    "rpe": "6–7", "exercises": ["Hip thrust 4×5", "Leg extension 1-bein 3×8", "Hamstring curl 3×8", "Calf raise 3×10"] },
  "tuesday":   { "type": "SPRINT",   "label": "Sprint-trening",            "rpe": "7–8", "exercises": ["Oppvarming 15 min", "Akselerasjoner × 4", "Flying 60m × 4", "Nedkjøling"] },
  "wednesday": { "type": "REHAB",    "label": "Sirkulasjon & mobilitet",   "rpe": "3–4", "exercises": ["Spanish squat ISO 3×25s", "Tib raises 3×15", "Calf raise m/vekt 2×10", "Hip ABD 2×12"] },
  "thursday":  { "type": "SPRINT",   "label": "Sprint-trening",            "rpe": "7–8", "exercises": ["Oppvarming 15 min", "Blokk-start × 4", "60m trening × 5", "Nedkjøling"] },
  "friday":    { "type": "STYRKE",   "label": "Styrke intensitet bein",    "rpe": "7–8", "exercises": ["Hip thrust 5×3", "Leg extension 1-bein 4×5", "RDL 2×5", "Calf raise 5×5"] },
  "saturday":  { "type": "REST",     "label": "Hviledag",                  "rpe": "—",   "exercises": ["Aktiv hvile OK", "Lett gange eller basseng"] },
  "sunday":    { "type": "SPRINT",   "label": "Sprint-trening",            "rpe": "6–7", "exercises": ["Oppvarming 15 min", "Teknikkarbeid", "60m × 4", "Nedkjøling"] }
}
```

---

## Component 4 — Injury Status card

Section eyebrow: `Patellarsene — status`. Full-width card.

**Three-column layout** (stack on mobile):

### Column 1 — Pain traffic light
- A large circle (80×80px SVG) acting as a traffic light indicator. Fill color based on today's logged pain score:
  - No score yet: `rgba(255,255,255,0.08)` with `?` inside, `--text-tertiary`.
  - 0–3: `rgba(107,227,164,0.20)` fill, `#6BE3A4` stroke, `✓` glyph — label `GRØNT LYS`.
  - 4: `rgba(242,192,99,0.20)` fill, `#F2C063` stroke, `!` glyph — label `GULT LYS`.
  - 5–6: `rgba(242,130,60,0.20)` fill, `rgba(242,130,60,1)` stroke, `!!` glyph — label `ORANSJE`.
  - 7–10: `rgba(255,107,107,0.20)` fill, `#FF6B6B` stroke, `✕` glyph — label `RØDT LYS`.
- Below the circle: score number large (28px, bold, color matches state), label text 9px uppercase mono below it.
- Below label: one-line rule text 10px italic tertiary:
  - 0–3: `Tren normalt`
  - 4: `Reduser volum neste økt 20%`
  - 5–6: `Stopp eksplosive øvelser`
  - 7–10: `Hvil — kontakt fysioterapeut`

### Column 2 — ACWR gauge
- Label `ACWR` — 10px uppercase mono tertiary.
- Large number (28px bold) showing the ratio, e.g. `1.18`. Color: <0.8 = `--accent-blue`, 0.8–1.3 = `--success`, >1.3 = `--danger`. If no data: `–`.
- Sub-label beneath: `< 0.8 for lite  ·  0.8–1.3 optimalt  ·  > 1.3 risiko` — 9px tertiary, centered.
- ACWR is calculated from `sprint_log` entries: acute load = sum of RPE values from the last 7 days; chronic load = average weekly RPE sum over the last 4 weeks. Formula: `acwr = acute / chronic`. If chronic is 0, show `–`.

### Column 3 — Trend sparkline
- Label `Smertetrend — siste 14 dager` — 10px mono tertiary.
- A small inline SVG bar chart (200×50px viewBox) showing daily max pain score for the last 14 days. Each day = one bar. Color: same 4-tier color coding as traffic light. Missing days = 0 height bar with faint outline. No axis labels — clean and minimal.
- Below: trend arrow and label computed from comparing the average of the last 3 days vs the 3 days before that:
  - Improving (diff < −0.3): `↓ Bedre` in `--success`.
  - Worsening (diff > 0.3): `↑ Verre` in `--danger`.
  - Stable: `→ Stabilt` in `--text-secondary`.

**Bottom row** — a horizontal strip of the last 7 days as mini calendar pills:
- Each pill: day abbreviation (Mon, Tue…) and a colored dot for that day's score (same color scale). If no score: empty dot outline. Today's pill gets a white 1px border.

---

## Component 5 — Recovery & Sleep card

Section eyebrow: `Restitusjon & søvn`. Two-column layout (stack on mobile).

### Left — Donut sleep score
- A 120×120px donut SVG ring (holeSize ~65%, startAngle 270°, same technique as Day Ring).
- Fill arc = sleep score out of 100. Color: ≥80 = `#6BE3A4`, 60–79 = `#F2C063`, <60 = `#FF6B6B`. Remainder arc: `rgba(255,255,255,0.06)`.
- Inside the donut (centered overlay): score number 32px bold, unit label `/ 100` 12px tertiary below.
- Below the donut: `Søvnscore siste natt` — 9px uppercase mono tertiary, centered.

### Right — Metrics grid
A 2×3 grid of small metric tiles:
1. `Søvntimer` — value from `sleep_log[today].hours` (e.g. `8.4 t`), 18px mono bold.
2. `Hvilepuls` — value from `sleep_log[today].rhr` (e.g. `52 bpm`), 18px mono bold. Color `--danger` if >65.
3. `HRV` — value from `sleep_log[today].hrv`, 18px mono bold. Tertiary if no data.
4. `Humør` — value from `sleep_log[today].mood` (1–5), rendered as filled/empty dots `●●●○○`. Color `--success` if ≥4.
5. `Body battery` — value from `sleep_log[today].battery` (0–100, ZEPP field), 18px mono bold. Color coded same as sleep score.
6. `Steg` — value from `sleep_log[today].steps`, 18px mono bold.

Each tile: `rgba(255,255,255,0.03)` background, 10px radius, 10px×12px padding, label 8px uppercase mono tertiary above value.

### ZEPP live data fetch

On page load (and every 30 minutes via `setInterval`), call `/.netlify/functions/zepp-data` with a plain `fetch()` GET request. No auth headers needed from the browser — the Netlify function handles token refresh server-side.

```js
async function loadZeppData() {
  try {
    const res  = await fetch("/.netlify/functions/zepp-data");
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    // data shape: { sleep: { hours, score, deepMin, remMin }, rhr, hrv, steps, battery, timestamp }
    storeSet(`sleep_log_${getActiveDateString()}`, data);
    renderRecoveryCard();
  } catch (err) {
    console.warn("Zepp fetch failed — showing cached or empty state:", err.message);
    // Silent failure: show last cached data from localStorage or "–" tiles
  }
}
```

When the function returns `{ error: "Zepp env vars not configured…" }` (HTTP 503), show a single banner inside the Recovery card: `⚙ Zepp ikke koblet til — legg til API-nøkler i Netlify` — 10px tertiary italic, centered. No form, no manual input.

When running locally (VS Code Live Server, `file://`), `fetch("/.netlify/functions/zepp-data")` will 404. Detect this by catching the error and falling back silently to the cached `sleep_log_YYYY-MM-DD` key in localStorage if it exists, or showing `–` tiles. Do **not** show a form or error banner when running locally — just show the cached data.

**7-day sleep trend** — a small line graph (SVG, 100% wide × 40px tall) below the grid. Plots `sleep.hours` from the last 7 `sleep_log_YYYY-MM-DD` localStorage keys. Points: 4px circles, color based on score. Missing days: dashed gap in the polyline. No axis labels.

---

## Component 6 — Sprint PB Board

Section eyebrow: `Personlige rekorder — sprint`. Full-width card.

**Layout:** a 4-column grid (2 on mobile), one cell per distance: 60m, 100m, 150m, 200m.

Each cell:
- Distance label — 11px mono uppercase, `--text-tertiary`.
- PB time — 36px mono bold, `--text-primary`, `letter-spacing: -0.04em`. If no time: `—` in tertiary.
- Date of PB — 10px mono, `--text-tertiary`. Format: `DD.MMM.YY`.
- A thin bottom accent bar (4px tall, 40% width, centered) colored based on how recently the PB was set: <30 days = `--success` glow; 30–90 days = `--warning`; >90 days = `rgba(255,255,255,0.1)`.
- On hover: card lifts slightly (translateY −2px, 0.2s ease).

**Quick-log row** below the grid:
`<select>` for distance (options: 60m, 80m, 100m, 150m, 200m), a number input for time (seconds, step 0.01), a date input (default today), a `<select>` for type (Trening / Stevne), and a `Logg` button.

On log: push `{ distance, time, date, type }` to `sprint_log` array in localStorage. If the new time is faster than current PB for that distance, update `pbs` object and animate the PB cell with a `--success` pulse (scale 1.0 → 1.06 → 1.0, 0.5s). Else just store the session without PB update.

**PB source:** `pbs` localStorage object — `{ "60m": { time: 6.87, date: "2026-04-12" }, "100m": { time: 11.52, date: "2026-05-09" }, ... }`. Pre-populate with Filip's actual current PBs as the default initial value if the key doesn't exist:
```json
{ "60m": { "time": 6.87, "date": "2026-04-12" }, "100m": { "time": 11.52, "date": "2026-05-09" }, "150m": { "time": 15.00, "date": "2026-05-22" }, "200m": { "time": 23.11, "date": "2026-05-10" } }
```

---

## Component 7 — Weekly Schedule

Section eyebrow: `Ukeoversikt`. Full-width card.

**Layout:** 7 columns, one per day (Mon–Sun). On mobile: a horizontal scroll container so all 7 days are visible (no wrapping), each column min-width 80px.

Each day column:
- Day label — 9px mono uppercase, `--text-tertiary`. Today's day gets `--text-primary` and a 2px underline in `--success`.
- Session type badge — same color-coded pill as in the Today's Session card (`SPRINT`, `STYRKE`, `REHAB`, `REST`, etc.). Font 9px, compact padding 2px×6px.
- If today or a future day: show a small RPE target label (e.g. `RPE 7`) in 8px mono tertiary.
- If a past day: show whether a session was completed. Read from `sprint_log` and `strength_log` entries: if a log entry exists for that date → show a `✓` in `--success`; if no entry but a session was scheduled → show a `–` in `--danger` (missed). Past days get 0.5 opacity on the badge.

**Google Calendar live overlay** — on page load (and every 15 minutes), call `/.netlify/functions/google-calendar` with a plain `fetch()` GET:

```js
async function loadCalendarEvents() {
  try {
    const res    = await fetch("/.netlify/functions/google-calendar");
    if (!res.ok) throw new Error(await res.text());
    const { events } = await res.json();
    // events shape: [{ id, title, start, end, allDay, color }]
    storeSet("calendar_events", events);
    renderWeeklySchedule();
  } catch (err) {
    console.warn("Calendar fetch failed — showing local plan only:", err.message);
  }
}
```

When Google Calendar events exist for a day, render them below the session type badge in that day column as small event pills: `rgba(255,255,255,0.06)` background, 9px, max one line, ellipsis overflow. All-day events get a left `3px solid` accent using Google's color mapping:
- colorId 1 (Lavender) → `#A8C8FA`
- colorId 2 (Sage) → `#6BE3A4`
- colorId 5 (Banana) → `#F2C063`
- colorId 6 (Tangerine) → `#FF9068`
- colorId 11 (Tomato) → `#FF6B6B`
- All others → `rgba(255,255,255,0.3)`

Time events show start time before the title in 8px mono tertiary: e.g. `14:30 Legesjekk`.

When the function returns a 503 (env not configured) or when running locally, show the weekly schedule using only `weekly_plan` localStorage data — no banner, silent fallback.

**Edit mode toggle** — a small `Rediger plan` button (10px, glass pill) in the section header right side. When active, each day column gets a `<select>` dropdown to change the session type and a text input for the label. On save, write to `weekly_plan` in localStorage and re-render. Calendar events are always read-only (they come from Google).

---

## Component 8 — Strength Plan

Section eyebrow: `Styrkeplan`. Full-width card.

**Layout:** Three columns (stack on mobile) — Monday, Wednesday (Rehab/Mob), Friday — matching Filip's actual program.

Each column:
- Day header pill — same color coding as session type. Below it: session label in 12px `--text-secondary`.
- Exercises list. Each exercise row:
  - Name — 12px, `--text-primary`.
  - Sets × reps — 11px mono, `--text-tertiary`.
  - Weight (optional) — 11px mono, `--warning` color.
  - A small `●` indicator colored `--success` if the exercise has a logged entry today; `rgba(255,255,255,0.1)` otherwise.

**Default exercises** pre-populated from Filip's actual program:

Monday (Styrke kapasitet):
- Hip thrust — 4 × 5 — 120 kg
- Leg extension 1-bein — 3 × 6–8 — 30 kg
- Hamstring curl — 3 × 6–8 — 22.5 kg
- Standing calf raise — 3 × 6–8 — 30 kg
- Seated calf raise — 3 × 10–12 — 30 kg

Wednesday (Rehab & mobilitet):
- Spanish squat ISO m/ strikk — 3 × 25 sek
- Tib raises — 3 × 12–15
- Standing calf raise m/ vekt — 2 × 10
- Sideliggende abduksjon m/ strikk — 2 × 10–12

Friday (Styrke intensitet):
- Hip thrust — 5 × 3
- Leg extension 1-bein — 4 × 5
- Hamstring curl — 2 × 5–6
- RDL — 2 × 5–6
- Standing calf raise — 5 × 4–6
- Seated calf raise — 3 × 8–10

Store this as `strength_plan` in localStorage (pre-populated on first load). No inline editing needed for this iteration — plan is read-only display.

**Andreas Havre-godkjente øvelser** — a collapsible `<details>` section at the bottom of the card with summary `✓ Andreas Havre-godkjente øvelser`. When expanded, shows a read-only list:
1. Knebøy — touche bakken bak (på boks)
2. Sideknebøy — touche bakken
3. Sideknebøy — touche med andre fot
4. RDL
5. Tåhev maskin — 1.5 × kroppsvekt

Styling: 10px tertiary italic, with a `--success` bullet `✓` before each item.

---

## Component 9 — To Do List

**Identical to the reference spec.** All behavior, animations, localStorage keys, streak logic, rollover, and active-date boundary (6 AM) preserved exactly. Section title reads exactly `To Do List` — capital T, D, L.

The only addition: when adding a goal, prepend a small session-type glyph if the text starts with a known keyword:
- starts with `Sprint`, `sprint` → prepend `🏃`
- starts with `Styrke`, `styrke` → prepend `💪`
- starts with `Søvn`, `søvn` → prepend `😴`
- starts with `Kne`, `kne`, `Rehab`, `rehab` → prepend `🦵`
This is cosmetic only — the raw stored text is unchanged.

---

## Logic & state — all localStorage keys

| Key | Shape | Notes |
|---|---|---|
| `goals:YYYY-MM-DD` | `[{ text, done, doneAt?, queued? }]` | To Do List (reference) |
| `goal_streak_v1` | `{ count, lastProcessedDate }` | Streak (reference) |
| `weekly_plan` | `{ monday: { type, label, rpe, exercises[] }, … }` | 7-day session plan |
| `strength_plan` | `{ monday: [...], wednesday: [...], friday: [...] }` | Exercise lists |
| `sprint_log` | `[{ date, distance, time, rpe?, type, kneScore? }]` | All sprint sessions |
| `strength_log` | `[{ date, session, rpe, kneBefore?, kneUnder?, kneAfter?, notes? }]` | All strength sessions |
| `injury_log` | `{ "YYYY-MM-DD": { score, sessionType } }` | Daily knee pain |
| `sleep_log` | `{ "YYYY-MM-DD": { hours, score, rhr, hrv, mood, battery, steps } }` | Daily recovery data |
| `pbs` | `{ "60m": { time, date }, … }` | Personal bests per distance |

**Helper functions** (same pattern as reference):
- `storeGet(key)` → `JSON.parse` or null.
- `storeSet(key, value)` → `localStorage.setItem` stringified.
- `getActiveDateString()` — if hours < 6, subtract one day. Format `YYYY-MM-DD`.
- `getTodayDayName()` — returns `"monday"` through `"sunday"` in lowercase.
- All components that re-render on data change listen for their respective custom events: `injury-logged`, `sprint-logged`, `sleep-logged`.

**ACWR calculation** (used by Injury Status card):
```js
function calcACWR() {
  const log = storeGet('sprint_log') || [];
  const now = new Date();
  const msPerDay = 86400000;
  let acute = 0;
  let weeklyLoads = [0, 0, 0, 0]; // last 4 weeks
  log.forEach(entry => {
    const daysAgo = Math.floor((now - new Date(entry.date)) / msPerDay);
    const rpe = entry.rpe || 0;
    if (daysAgo < 7) acute += rpe;
    const weekIdx = Math.floor(daysAgo / 7);
    if (weekIdx < 4) weeklyLoads[weekIdx] += rpe;
  });
  const chronic = weeklyLoads.reduce((a, b) => a + b, 0) / 4;
  return chronic === 0 ? null : +(acute / chronic).toFixed(2);
}
```

---

## Responsiveness

- Desktop (>900px): Day Ring + Today's Session side by side; Injury Status 3-column; Recovery 2-column; PB Board 4-column; Strength Plan 3-column.
- Tablet (640–900px): Today's Session goes full width below ring; PB Board 2-column; Strength Plan 2-column.
- Mobile (≤480px): Everything stacks single column. Weekly Schedule horizontally scrollable. Font sizes reduce as per reference.

---

## Acceptance checklist

- File opens from `file://` URL or VS Code Live Server with zero console errors.
- Page title `Filip's Dashboard` renders with gradient text.
- Goal Ticker shows green LED, cycles pending goals every 5s, updates immediately on edit.
- Day Ring shows correct percentage and color for current time.
- Today's Session card shows the correct day's planned session based on system date.
- Tapping a pain score 0–10 button saves to `injury_log`, updates traffic light color, and trend sparkline immediately.
- Recovery card shows `–` tiles until ZEPP form is filled; after save, all 6 metric tiles populate.
- Sprint log form adds to `sprint_log`; if faster than existing PB, the PB cell pulses green and updates.
- Weekly Schedule shows `✓` on past days where log entries exist, `–` on missed days.
- Strength plan shows all three columns with Filip's actual exercises pre-populated.
- ACWR displays correctly once sprint log has RPE entries; shows `–` with no data.
- To Do List: add, check, delete, drag-reorder, queue, inline-edit, push-remaining, tomorrow list all work. Section title reads exactly `To Do List`.
- Refreshing the page restores all state from localStorage.
- No hardcoded dates — all time-sensitive logic uses `new Date()`.
- The `.bak` backup file can be deleted — it was a safety copy from an automated script.

---

## Implementation notes for Claude Code

- Declare all localStorage keys and default values at the top of the `<script>` as constants so they are easy to find and change.
- Declare `const ANTHROPIC_API_KEY = '';` at the top for the To Do List Polish feature (same as reference).
- All SVG rings (Day Ring and Sleep Score donut) share the same `drawRing(svgEl, percent, color, glowColor)` helper function — do not duplicate the ring-drawing logic.
- Separate rendering functions per component: `renderInjuryCard()`, `renderRecoveryCard()`, `renderPBBoard()`, `renderWeeklySchedule()`, `renderTodaySession()`. Each re-reads from localStorage and rebuilds its section.
- The weekly schedule edit mode is the only place that writes to `weekly_plan`. All other components only read from it.
- ZEPP integration is manual input only in this version. Do not attempt to call any external ZEPP API — that requires OAuth and a backend. Leave a clearly marked `// TODO: Zepp OAuth integration` comment block in the ZEPP input section's save handler.
- Google Calendar is out of scope for this version. Leave a `// TODO: Google Calendar API embed` comment at the end of the Weekly Schedule section.
---

## Netlify functions — do not rewrite, use as-is

The two serverless functions are already written and ready at `netlify/functions/zepp-data.js` and `netlify/functions/google-calendar.js`. Do **not** regenerate or modify them. The `netlify.toml` config file is also already in place.

Your job is only to write `dashboard.html` that calls `/.netlify/functions/zepp-data` and `/.netlify/functions/google-calendar` via `fetch()` as specified in the Recovery card and Weekly Schedule sections above.

---

## Deployment

1. Open a terminal in the project root folder (where `netlify.toml` lives).
2. Run `netlify deploy --prod` (requires Netlify CLI: `npm install -g netlify-cli`).
3. Or: drag the entire folder (not just the HTML) to netlify.com/drop.
4. In Netlify dashboard → Site settings → Environment variables, add:
   - `ZEPP_APP_ID`
   - `ZEPP_APP_SECRET`
   - `ZEPP_REFRESH_TOKEN`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
   - `GOOGLE_CALENDAR_ID` (set to `primary` for your main calendar)

The dashboard works locally without any of these keys — it just shows cached or empty data. The live data appears automatically once deployed with the keys set.
