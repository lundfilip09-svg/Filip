# Handoff-prompt — Opus 4.8 (2026-06-15)

Gjenstående punkter fra Filips ønskeliste. Punkt 4 (AI-gymdager) og 6 (flytt
forfalte gjøremål) er allerede gjort i denne økta. Punkt 5 (legge til i dag/i
morgen) var allerede bygget (`addDashTodo` i `dashboard.html`) — bare verifiser
at den føles "funksjonell nok". Punkt 7 (push på andre apper) er ferdig kodet
(Web Push/VAPID/QStash) — krever bare engangsoppsettet i
`2026-06-13-push-varsler-oppsett.md`, ikke ny kode.

---

Du jobber på Filips personlige helse-/treningsdashboard (vanilla HTML/CSS/JS,
Vercel + Supabase, tospråklig norsk/engelsk). **Les `CLAUDE.md` i rotmappa først**
— særlig i18n-reglene. ALL synlig tekst MÅ legges i BÅDE `TRANSLATIONS.no` og
`.en` i `utils.js`, og dynamisk tekst må re-rendres ved språkbytte (`onLangChange`).

Behandl hvert punkt separat: foreslå tilnærming + vis hvilke filer som endres +
vent på OK før du koder. Bekreft før sletting/overskriving. Ikke rør filer utenfor
mappa. Kjør `node --check` på endret JS og verifiser lik nøkkeltelling no/en før du
sier deg ferdig. Test BEGGE språk i nettleseren.

## 1. Varselsenter (ikon øverst på alle sider)
Legg til et varselikon med tall-badge i toppen, likt på tvers av alle sider (del
komponenten via `utils.js`). Klikk åpner en dropdown/panel som samler aktive
varsler: forfalte + dagens gjøremål, satte påminnelser (`todos.remind_at`), og
aktive hviletimer. Gjenbruk eksisterende data — todos-spørringen finnes i
`dashboard.html` (`loadTodos`), push/påminnelser i `api/push/*` og
`scheduled_notifications`-tabellen. Ikke duplisér henting; lag én delt kilde.

## 2. Kontekstuell fjerning av varsler
Når Filip navigerer til den siden som "eier" et varsel, skal varselet forsvinne
fra senteret — f.eks. hviletimer-varsel fjernes når han er på `gym.html`. Definer
per varseltype hvilken side som kvitterer det (en liten `{ type → side }`-mapping).
Avhenger av punkt 1.

## 3. Gym — anbefalt vs. faktisk + overload
På `gym.html`: hver øvelse skal vise anbefalt rep-/sett-intervall ved siden av
input. Anbefalt ligger ALLEREDE i `workout_program.reps` (tekst, f.eks. "10–12")
og `workout_program.sets`. Lagre faktisk utført verdi separat fra anbefalt (sjekk
`supabase/migrations/019_set_log.sql` for hvordan sett logges i dag — utvid den
strukturen, ikke lag en parallell). Eksponer begge i dataene som sendes til AI
(`api/_lib/context.js` har nå en `[GYM-PROGRAM PER DAG]`-blokk med anbefalt — legg
til faktisk-vs-anbefalt der det er relevant) slik at overload-coachen kan
sammenligne og foreslå progresjon. NB: dette er den største jobben — `gym.html` er
~3460 linjer. Kartlegg eksisterende logge-flyt før du rører UI-et.

---

### Kontekst om Filip
17 år, sprinter (100/200m) + styrke, 70kg/187cm, ~6 økter/uke. Patellar
tendinopati venstre kne. Smerteskala 0–10 i alle logger. Bruker norsk hjemme,
engelsk overfor trenere i USA (høst 2026–vår 2027) — derfor tospråklig-kravet.
