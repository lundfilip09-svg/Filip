# ChatGPT Codex Prompt — Personal Health & Training Dashboard

> Copy everything below this line and paste it as your first message to ChatGPT Codex.

---

## Project overview

Build me a **personal health and training dashboard** — a single-page-app suite using **vanilla HTML/CSS/JS**, hosted on **Vercel**, with **Supabase (Postgres)** as the backend. No frameworks, no build steps. All pages share one `utils.js` and one `styles.css`.

I use an **Apple Watch** for health data (sleep, HRV, resting heart rate, activity). Data is pushed to Supabase via Apple Shortcuts → a small Vercel serverless function (webhook endpoint).

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla HTML / CSS / JS |
| Hosting | Vercel (static + serverless `api/` functions) |
| Database | Supabase (Postgres, anon key in client) |
| Auth | Supabase email/password |
| Health data | Apple Watch → Apple Shortcuts → Supabase webhook |
| Charts | Chart.js (CDN) |

---

## Pages / modules

Create one `.html` file per module. All share `utils.js` and `styles.css`.

### 1. `dashboard.html` — Main overview
- Today's sleep score + HRV + resting heart rate (from Apple Watch)
- Today's planned workout (from weekly plan, overrideable per day)
- Focus note / daily intention (free text, saved to Supabase)
- Todo quick-list (top 3 tasks due today)
- Mini week-strip showing planned sessions Mon–Sun

### 2. `gym.html` — Workout logger
- Log strength sessions: exercise name, sets × reps × weight (kg)
- Session history with date, total volume
- Notes field per session
- No sport-specific fields — generic and flexible

### 3. `sovn.html` — Sleep tracker
- Log / view sleep: date, duration (hours), sleep score (0–100), HRV, resting heart rate
- Chart.js graphs: score over time, HRV trend, RHR trend
- Data comes from Apple Watch via webhook, but manual entry also supported

### 4. `gjoremal.html` — Todo / goals
- Multiple named lists
- Tasks with optional due dates and priority
- Mark complete, archive

### 5. `kalender.html` — Calendar
- Month view + week view
- Show planned workouts from weekly plan
- Add custom events (title, date, time, notes)
- Events stored in Supabase

### 6. `treningsplan.html` — Training plan
- Two-layer plan (same as below under "Weekly plan logic")
- Click on a day to see/edit session details
- Drawer/modal for detail view

### 7. `ai.html` + `api/ai-chat.js` — AI assistant
- Chat interface powered by OpenAI GPT-4o (or Claude via Anthropic API — configurable)
- Passes live context: today's sleep, recent workouts, current week plan
- Context fetched fresh from Supabase on each message

### 8. `login.html` — Auth
- Supabase email + password login
- Redirect to dashboard on success

---

## Weekly plan logic (two layers, keep in sync across all pages)

- `weekly_plan` table — the **fixed default week** (`day` 0–6, `session_type` text). Edited via a "Edit week plan" button.
- `training_plan_weekly` table — **per-day override**, anchored to that week's Monday (`week_monday` date, `day_index` 0–6, `session_text`, `notes`). Applies only to that specific week.

**Display rule:** use `weekly_plan` as base; if `training_plan_weekly` has a row for (this Monday + day_index), use that instead. `session_text === ''` means explicitly empty (rest day) — do NOT fall back to the base plan.

This logic must be consistent in `dashboard.html`, `treningsplan.html`, and `api/_lib/context.js`.

---

## Database — mandatory RLS on every table

The anon key is public (in the client). Supabase auto-exposes REST for every table in `public`. **Without RLS, any table is publicly readable/writable.** Therefore:

**Every `CREATE TABLE` migration must immediately follow with:**

```sql
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.<table> FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.<table>;
CREATE POLICY "authenticated_full_access" ON public.<table>
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
REVOKE ALL ON public.<table> FROM anon;
```

Single-user app → `auth.role() = 'authenticated'` is enough (no `user_id` filter needed). Server code in `api/` uses the service_role key which bypasses RLS — that's fine.

**Before declaring done, verify with:**
```sql
SELECT relname, relrowsecurity AS rls_on,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = c.relname) AS policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY rls_on, relname;
```
Every table must show `rls_on = true` and at least 1 policy.

---

## Tables to create (migrations in `supabase/migrations/`)

```
sleep_logs         (id, date, duration_hours, score, hrv, rhr, notes, created_at)
workout_sessions   (id, date, name, notes, created_at)
workout_sets       (id, session_id FK, exercise, sets, reps, weight_kg, created_at)
weekly_plan        (id, day int 0-6, session_type text)
training_plan_weekly (id, week_monday date, day_index int, session_text text, notes text)
calendar_events    (id, title, date, time, notes, created_at)
todos              (id, list_name, title, due_date, priority, done bool, created_at)
focus_notes        (id, date, note, created_at)
```

---

## Apple Watch webhook

Create `api/apple-watch-webhook.js`:
- Accepts POST with JSON body: `{ date, sleep_score, duration_hours, hrv, rhr }`
- Authenticates via a secret header (`x-webhook-secret` env var)
- Upserts into `sleep_logs` by date
- Used by an Apple Shortcut triggered each morning after the Watch syncs

---

## Folder structure

```
/
├── dashboard.html
├── gym.html
├── sovn.html
├── gjoremal.html
├── kalender.html
├── treningsplan.html
├── ai.html
├── login.html
├── utils.js
├── styles.css
├── api/
│   ├── ai-chat.js
│   ├── apple-watch-webhook.js
│   └── _lib/
│       └── context.js      ← fetches live data for AI context
├── supabase/
│   └── migrations/
│       ├── 001_sleep_logs.sql
│       ├── 002_workouts.sql
│       └── ...
└── vercel.json
```

---

## Style / UX guidelines

- Dark theme preferred, clean and minimal
- Mobile-friendly (used on phone to log workouts)
- Navigation: persistent bottom nav bar (or top hamburger on mobile) linking all pages
- No external UI frameworks — pure CSS
- Cards for each data section, subtle shadows

---

## Environment variables (`.env` / Vercel dashboard)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=       # used in client JS
SUPABASE_SERVICE_KEY=    # used only in api/ server functions
OPENAI_API_KEY=          # or ANTHROPIC_API_KEY depending on AI choice
WEBHOOK_SECRET=          # for Apple Watch webhook
```

---

## What to build first (suggested order)

1. Supabase schema + migrations (all tables + RLS)
2. `login.html` + auth flow
3. `utils.js` (Supabase client, shared helpers, nav)
4. `styles.css` (dark theme, card components, nav)
5. `dashboard.html`
6. `gym.html`
7. `sovn.html`
8. `gjoremal.html`
9. `kalender.html`
10. `treningsplan.html`
11. Apple Watch webhook (`api/apple-watch-webhook.js`)
12. `ai.html` + `api/ai-chat.js` + `api/_lib/context.js`
13. Deploy to Vercel + connect Supabase env vars

---

## Notes for you to tweak

- **AI provider:** the prompt uses GPT-4o but you can swap to Claude Sonnet via Anthropic API — just change `api/ai-chat.js`
- **Language:** all UI text is in Norwegian by default — add an English toggle if you want
- **Apple Watch data fields:** the webhook accepts `sleep_score, hrv, rhr` — adjust to match whatever your Shortcut exports
- **Workout types:** the gym logger is intentionally generic — add sport-specific fields later if needed
