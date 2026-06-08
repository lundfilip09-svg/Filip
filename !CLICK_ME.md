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
Filip Lund sitt personlige helse-/treningsdashboard — fullstack webapp som skal
erstatte alle betalte trenings-/helseapper med ett privat, skreddersydd verktøy.

TECH STACK
- Frontend: Vanilla HTML/CSS/JS, ingen rammeverk. Alle .html i rot.
- Delt: styles.css (dark glassmorphism-theme) + utils.js (i18n, toast, auth, dato).
- Backend: Vercel serverless functions i /api/. Database: Supabase (Postgres + Auth).
- Datakilder: Garmin (søvn/HRV/hvilepuls), egne styrke-/sprintlogger, Google Calendar.

⚠️ TOSPRÅKLIG (norsk + engelsk) — KRITISK
Filip bruker norsk hjemme og engelsk i USA (vis til trenere). Språkbryter 🇳🇴/🇺🇸.
ALL synlig tekst MÅ være tospråklig — aldri hardkod norsk/engelsk på skjermen.
- Statisk: data-i18n="nøkkel" (+ -placeholder/-title/-html). JS-tekst: alltid t('nøkkel').
- Legg nøkkel i BEGGE språk i utils.js (TRANSLATIONS.no OG .en — like mange nøkler).
- Datoer via fmtLocale()/Intl, ikke hardkodede norske navn.
- Dynamisk innhold re-rendres ved språkbytte via onLangChange på hver side.

SIDER
dashboard (oversikt), gym (styrkelogger + ukeplan man/ons/fre), sprint (logger + PB),
sovn (Chart.js: score/HRV/RHR/stadier), gjoremal (todo m/lister + forfall),
kalender (måned/uke + Google Calendar), treningsplan + treningsdagbok (øktlogg/historikk),
ai (AI Overseer-chat), login (Supabase auth).

AI OVERSEER (ai.html + api/ai-chat.js)
Chat på claude-sonnet-4-6 med live treningsdata som kontekst. Gir anbefalinger ut fra
søvn, HRV, knestatus og belastning. Full kontekst om Filips patellar tendinopati i
venstre kne (jan 2026). Smerteskala 0–10 i alle logger.

OM FILIP
17 år, sprinter (100/200m) + styrke, 70kg/187cm, ~6 økter/uke. Spiller også
fotball/basket i USA (høst 2026–vår 2027).

ARBEIDSFLYT
Filip pusher/committer selv (se git-linjene øverst i denne fila). Svar kort og
token-effektivt. Bekreft før sletting/overskriving. Verifiser node --check på endret
JS og at begge språk har like mange i18n-nøkler før du sier deg ferdig.