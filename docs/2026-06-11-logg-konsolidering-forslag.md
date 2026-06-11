# Konsolidering av logg-/plansider — kartlegging og forslag (falde fase 4)

**Status: forslag. Ingenting er slettet eller endret.**

## Hva hver flate faktisk gjør (målt på DB-tilgang)

| Flate | Rolle | Skriver til | Leser fra |
|---|---|---|---|
| `gym.html` | **Utfører** styrkeøkter (live økt, sett, vekter, program) | workout_program, active_session, set_log, exercise_weights, gym_days, gym_log, knee_pain | samme |
| `treningsplan.html` | **Planlegger + redigerer** all trening (ukeplan, aktivitetslogg, skader, fysio) | weekly_plan, training_plan, training_plan_weekly, week_plan_presets, activity_log, injuries, physio_notes (+korrigerer gym_log/sprint_log/knee_pain) | + health_data |
| `treningsdagbok.html` | **Ren visning** → PDF-eksport | *ingenting* (null writes) | gym_log, sprint_log, activity_log, knee_pain, injuries, sprint_records |
| dashboard «dagens økt» | **Ren visning** av dagens planlagte økt | ingenting | training_plan |

Konklusjon: sidene overlapper mindre enn antatt — rollene er komplementære
(utfører / planlegger / eksport / dagens). Å slå sammen sider gir lite.

## Den reelle dupliseringen: FIRE tabeller beskriver ukeplanen

1. `training_plan` (008) — én rad per ukedag, `session_text` + `notes` (standarduke)
2. `weekly_plan` (013) — én rad per ukedag, `session_type` (standarduke, igjen)
3. `training_plan_weekly` (014) — per konkret uke (`week_monday` + day_index)
4. `gym_days` (016) — gym-sidens egne dag-pills (day_key per styrkedag)

`training_plan` og `weekly_plan` er i praksis samme konsept med ulikt felt-navn —
begge leses av AI-konteksten, dashboard leser bare `training_plan`,
treningsplan-siden skriver til ALLE tre første. Dette er kilden til
«hvor er planen min egentlig?»-følelsen.

## Forslag (i prioritert rekkefølge, hver for seg reversibel)

**F1 — slå sammen `weekly_plan` inn i `training_plan`** (lav risiko):
`session_type` blir et felt på `training_plan`. Én migrasjon, oppdater
treningsplan.html (skriv), api/_lib/context.js (les), dashboard (uendret).
Resultat: standarduken har ÉN kilde.

**F2 — la `training_plan_weekly` arve fra standarduken eksplisitt**:
i dag er fallback-logikken (konkret uke → standarduke) implementert i
JS på flere sider. Flytt fallback til én delt funksjon i utils.js.

**F3 — `gym_days` forblir egen** (den styrer program-strukturen i gym,
ikke kalenderplanen) — men dokumentér koblingen i CLAUDE.md.

**F4 — sider røres ikke.** `treningsdagbok.html` er allerede en ren visning
(null writes) og koster ingenting å beholde. «Dagens økt» på dashboard
likeså.

## Hva jeg IKKE foreslår

- Slette noen av de fire sidene — rollene er reelle.
- Slå sammen gym.html og treningsplan.html — utførings- og planleggings-UX
  har motstridende behov (live økt vs. oversikt).
