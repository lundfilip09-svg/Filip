THINGS I USE OFTEN
Claude Debug Mode

Copy this into Claude Code:


Claude Slow Mode
/caveman debug

Claude Fast Mode
/caveman fast


Save everything to GitHub
Copy ALL 3 lines into terminal:

git add .
git commit -m "update"
git push origin main


Prompt for ny dashboard chat:
Filip Lund sitt personlige treningsdashboard — fullstack webapp.

TECH STACK
- Frontend: Vanilla HTML/CSS/JS, ingen rammeverk
- Backend: Vercel serverless functions (api/*.js)
- Database: Supabase (Postgres + Auth)
- Deployment: Vercel på filip-vita.vercel.app
- CSS: Én delt styles.css, dark theme (#050506 bakgrunn)
- Delte utils: utils.js (toast, signOut, escHtml, today(), fmtDate, painColor, getConfig)

SIDER (alle .html-filer i rot)
- dashboard.html — oversikt: søvn, knesmerte, dagens økt, fokus-liste, gjøremål, kalender, ukestrip
- gym.html — styrkeøkt-logger med øvelsesvelger, knesmerte per fase, ukeplan mandag/onsdag/fredag
- sprint.html — sprint-logger (drag & drop løpsrader), PB-tracker, knetrend
- sovn.html — søvnhistorikk med Chart.js-graf (score, HRV, RHR, søvnstadier)
- gjoremal.html — todo-app med lister, drag-reorder, forfallsdatoer, stjerner
- kalender.html — måneds-/ukevisning + tidslinje, Google Calendar + egne hendelser
- treningsplan.html — ukeplan + øktlogg (gym-historikk med klikk-for-detalj-drawer)
- ai.html — chat med Claude Sonnet (AI Overseer), henter live treningsdata som kontekst
- login.html — Supabase email/password auth

SUPABASE-TABELLER
- health_data: date, sleep_score, sleep_hours, hrv, rhr, deep_sleep_minutes, rem_sleep_minutes, timestamp
- knee_pain: id, date, session_type, before_score, during_score, after_score, day_after_score, notes, created_at
- gym_log: id, date, session_type, session_notes, user_id
- sprint_log: id, date, distance, time_seconds, type, rpe, knee_before, knee_during, knee_after, knee_day_after, notes
- todos: id, title, list_name, completed, completed_at, due_date, important, user_id
- training_plan: user_id, day_index (0=man..6=søn), session_text, notes
- workout_program: id, day, section, exercise_name, sets, reps, user_id
- exercise_weights: exercise_id, weight_kg, updated_at
- calendar_events: id, title, date, start_time, end_time, color, user_id

API-ENDEPUNKTER (Vercel functions i /api/)
- /api/config — returnerer SUPABASE_URL og SUPABASE_ANON_KEY
- /api/ai-chat — POST, tar {message, history[]}, returnerer {reply} fra Claude claude-sonnet-4-5
- /api/google-calendar — GET, returnerer {today:[], upcoming:[]} fra Google Calendar
- /api/garmin-sync — cron 05:45 UTC, synker helsedata fra Garmin til health_data
- /api/zepp-data, /api/kalender — eldre/ubrukte endepunkter

DESIGN-SYSTEM
- Farger: --text-primary #FAFAFA, --success #6BE3A4, --warning #F2C063, --danger #FF6B6B, --accent-blue #5BA4F5
- Fonter: system-ui sans + ui-monospace mono
- Kort: glassmorphism (backdrop-filter blur), border rgba(255,255,255,0.06)
- Skeleton-loader: .sk .sk-block med shimmer-animasjon
- Toast: bottom-right, .toast.ok/.err

VIKTIGE PATTERNS
- Auth-sjekk på alle sider: getConfig() → supabase.createClient() → getSession() → redirect til login.html
- today() i utils.js returnerer lokal dato YYYY-MM-DD (ikke UTC)
- Knesmerte kobles til økt via date + session_type som sammensatt nøkkel
- Treningsplan-historikk: klikk på sess-card åpner drawer (sess-detail.open) med inline-redigering
- Sprint-historikk: samme drawer-mekanikk etter siste oppdatering

KJENTE ÅPNE PUNKT (ikke fikset ennå)
- Ingen favicon/PWA-manifest
- AI-chat lagres i localStorage (ikke synk på tvers av enheter)
- Treningsoversikt mangler sprint-log i tidslinje (kun gym_log)
- Drag-reorder i gjøremål lagres kun i localStorage
- saveLog() i gym og sprint mangler dobbelt-klikk-guard
- Søvn-chart bruker toISOString (UTC) for dato-aksen
- console.log-kall ikke fjernet fra gym.html og sprint.html
- vercel.json rewrites dekker ikke alle sider
- ai-chat max_tokens=2000 er lavt