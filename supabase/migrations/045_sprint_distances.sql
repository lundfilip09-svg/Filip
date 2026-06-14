-- 045_sprint_distances.sql
-- Gjør sprint-distansene DB-drevne og redigerbare (#5).
-- Utvider sprint_records (keyet på distance) med config-kolonner i stedet for
-- en egen tabell, så all eksisterende lesing (select *, select distance,best_time)
-- fortsetter å virke uendret. RLS røres ikke (sprint_records hadde ingen i 003).
--
-- Kolonner:
--   color            text     – farge på mål-bjelken
--   sort_order       int      – rekkefølge i dropdown / PB-board / mål
--   show_pb          boolean  – vis distansen som PB-kort
--   show_goal        boolean  – vis distansen i mål-seksjonen (mål-bjelke)
--   all_runs_count   boolean  – PB teller ALLE typer (ikke bare Stevne); for celle-/gate-tid à la 60m_celler
-- Eksisterende: best_time, baseline_time (017), goal_time (028), date.

ALTER TABLE sprint_records ADD COLUMN IF NOT EXISTS color          text;
ALTER TABLE sprint_records ADD COLUMN IF NOT EXISTS sort_order     integer DEFAULT 100;
ALTER TABLE sprint_records ADD COLUMN IF NOT EXISTS show_pb        boolean DEFAULT false;
ALTER TABLE sprint_records ADD COLUMN IF NOT EXISTS show_goal      boolean DEFAULT false;
ALTER TABLE sprint_records ADD COLUMN IF NOT EXISTS all_runs_count boolean DEFAULT false;

-- Seed / migrer eksisterende distanser. COALESCE bevarer alt Filip allerede har
-- satt (best_time, egne baseline/goal/farge-edits) ved re-kjøring – overskriver aldri.
-- best_time/date røres ALDRI her.
INSERT INTO sprint_records
  (distance, color, sort_order, show_pb, show_goal, all_runs_count, baseline_time, goal_time)
VALUES
  ('60m',        NULL,      10,  true,  false, false, NULL,  NULL),
  ('60m_celler', NULL,      20,  true,  false, true,  NULL,  NULL),
  ('60m_flying', NULL,      30,  false, false, false, NULL,  NULL),
  ('80m',        NULL,      40,  false, false, false, NULL,  NULL),
  ('100m',       '#5BA4F5', 50,  true,  true,  false, 11.52, 11.10),
  ('120m',       NULL,      60,  false, false, false, NULL,  NULL),
  ('150m',       NULL,      70,  false, false, false, NULL,  NULL),
  ('180m',       NULL,      80,  false, false, false, NULL,  NULL),
  ('200m',       '#6BE3A4', 90,  true,  true,  false, 23.11, 22.30),
  ('220m',       NULL,      100, false, false, false, NULL,  NULL)
-- Seed-verdiene er autoritative for config-flaggene (EXCLUDED direkte) – ellers
-- vinner DEFAULT-false-backfillen fra ALTER over en COALESCE og alt blir skjult.
-- Brukerdata (goal_time/baseline_time) og egne farge-edits bevares med COALESCE.
ON CONFLICT (distance) DO UPDATE SET
  color          = COALESCE(EXCLUDED.color, sprint_records.color),
  sort_order     = EXCLUDED.sort_order,
  show_pb        = EXCLUDED.show_pb,
  show_goal      = EXCLUDED.show_goal,
  all_runs_count = EXCLUDED.all_runs_count,
  baseline_time  = COALESCE(sprint_records.baseline_time, EXCLUDED.baseline_time),
  goal_time      = COALESCE(sprint_records.goal_time,     EXCLUDED.goal_time);
