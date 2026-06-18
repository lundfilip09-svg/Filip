-- 051_session_templates.sql
-- Forfremmer gym_days -> session_templates: et UKEDAGS-AGNOSTISK bibliotek av
-- økt-maler. weekly_plan / training_plan_weekly / workout_program peker på en mal
-- via template_id. Ukedagen bor fortsatt i weekly_plan.day — malen vet ikke
-- hvilken dag den ligger på.
--
-- ⚠️ ADDITIV OG IKKE-DESTRUKTIV. Gamle kolonner (workout_program.day,
-- weekly_plan.session_type, training_plan_weekly.session_text) BEHOLDES. De
-- droppes først i en senere 052_*.sql, etter at frontend er skrevet om og
-- verifisert mot de nye kolonnene.
--
-- DATATAP ER UMULIG: hver distinkt ikke-tom plantekst får sin egen mal, så
-- backfill blir total. Kun tom tekst / 'Hvile'/'Rest' = hvile (template_id NULL).
-- Umatchet tekst kan derfor ALDRI bli stille gjort om til en hviledag.
--
-- HISTORIKK RØRES IKKE: gym_log.session_type og set_log.day_key forblir
-- tekst-snapshots (ingen FK). Begge historikk-kildene behandles likt.
--
-- Idempotent: trygg å kjøre flere ganger. Ingen TEMP-tabell / ingen eksplisitt
-- transaksjon — Supabase SQL-editor kjører setninger separat, så tekst->i18n-
-- kartet ligger inline som CTE i hver setning som trenger det.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Biblioteket
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,                 -- unik identitet; vises for egendefinerte maler
  kind         text NOT NULL DEFAULT 'other'
                 CHECK (kind IN ('strength','mobility','rehab','sprint','other')),
  i18n_key     text,                                 -- for innebygde maler; NULL = vis name som-er
  is_protected boolean NOT NULL DEFAULT false,       -- true = kan ikke slettes (Rehab)
  sort_order   integer NOT NULL DEFAULT 0
);

ALTER TABLE session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_templates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_full_access" ON session_templates;
CREATE POLICY "authenticated_full_access" ON session_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON session_templates TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Seed innebygde maler fra gym_days (type_label er allerede en i18n-nøkkel).
--    name = slug uten 'daytype.'-prefiks; kind utledet fra inline-kartet (lm).
--    Kartet speiler _SESSION_TYPE_KEYS + daytype.* i utils.js (no + en).
-- ─────────────────────────────────────────────────────────────────────────────
WITH lm(lc, i18n_key, kind) AS (VALUES
  ('styrke','daytype.strength','strength'),
  ('strength','daytype.strength','strength'),
  ('styrke kapasitet','daytype.strength_capacity','strength'),
  ('strength capacity','daytype.strength_capacity','strength'),
  ('styrke power','daytype.strength_power','strength'),
  ('strength power','daytype.strength_power','strength'),
  ('power','daytype.power','strength'),
  ('sirkulasjon & mobilitet','daytype.mobility','mobility'),
  ('mobility & conditioning','daytype.mobility','mobility'),
  ('kondisjon','daytype.conditioning','mobility'),
  ('conditioning','daytype.conditioning','mobility'),
  ('rehab','daytype.rehab','rehab'),
  ('fotball','daytype.soccer','other'),
  ('soccer','daytype.soccer','other'),
  ('basketball','daytype.basketball','other'),
  ('friidrett','daytype.track','other'),
  ('track','daytype.track','other'),
  ('sprint','daytype.sprint','sprint')
)
INSERT INTO session_templates (name, kind, i18n_key, is_protected, sort_order)
SELECT
  COALESCE(replace(gd.type_label, 'daytype.', ''), gd.day_key),
  COALESCE(MAX(lm.kind), 'other'),
  gd.type_label,
  bool_or(gd.is_protected),
  MIN(gd.sort_order)
FROM gym_days gd
LEFT JOIN lm ON lm.i18n_key = gd.type_label
GROUP BY gd.type_label, gd.day_key
ON CONFLICT (name) DO NOTHING;

-- Sørg for at 'Sprint' finnes som mal (brukes i ukeplanen, men er ingen gym_day)
INSERT INTO session_templates (name, kind, i18n_key, is_protected, sort_order)
VALUES ('Sprint', 'sprint', 'daytype.sprint', false, 50)
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Auto-opprett en mal for HVER distinkt ikke-tom plantekst som ikke allerede
--    er dekket. Datatap-garantien: ingenting forblir uten mal.
--    'hvile'/'rest' og tom tekst hoppes over (= hvile).
-- ─────────────────────────────────────────────────────────────────────────────
WITH lm(lc, i18n_key) AS (VALUES
  ('styrke','daytype.strength'),('strength','daytype.strength'),
  ('styrke kapasitet','daytype.strength_capacity'),('strength capacity','daytype.strength_capacity'),
  ('styrke power','daytype.strength_power'),('strength power','daytype.strength_power'),
  ('power','daytype.power'),
  ('sirkulasjon & mobilitet','daytype.mobility'),('mobility & conditioning','daytype.mobility'),
  ('kondisjon','daytype.conditioning'),('conditioning','daytype.conditioning'),
  ('rehab','daytype.rehab'),
  ('fotball','daytype.soccer'),('soccer','daytype.soccer'),
  ('basketball','daytype.basketball'),
  ('friidrett','daytype.track'),('track','daytype.track'),
  ('sprint','daytype.sprint')
),
plan_texts AS (
  SELECT DISTINCT trim(session_type) AS raw FROM weekly_plan WHERE trim(session_type) <> ''
  UNION
  SELECT DISTINCT trim(session_text) AS raw FROM training_plan_weekly WHERE trim(session_text) <> ''
)
INSERT INTO session_templates (name, kind, i18n_key, sort_order)
SELECT pt.raw, 'other', NULL, 100
FROM plan_texts pt
LEFT JOIN lm ON lm.lc = lower(pt.raw)
WHERE lower(pt.raw) NOT IN ('hvile','rest')
  AND lm.i18n_key IS NULL                                   -- ikke en kjent innebygd
  AND NOT EXISTS (SELECT 1 FROM session_templates s WHERE s.name = pt.raw)
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) Nye template_id-kolonner (nullable, additivt)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE workout_program      ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES session_templates(id) ON DELETE CASCADE;
ALTER TABLE weekly_plan          ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES session_templates(id) ON DELETE RESTRICT;
ALTER TABLE training_plan_weekly ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES session_templates(id) ON DELETE RESTRICT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5) Backfill template_id
-- ─────────────────────────────────────────────────────────────────────────────
-- 5a) workout_program via gym_days-broen (day -> day_key -> type_label -> mal).
--     warmup/friday_warmup har ingen gym_day og forblir NULL — håndteres i
--     frontend-fasen (delt oppvarming). Gammel .day-kolonne lever videre.
UPDATE workout_program wp
SET template_id = st.id
FROM gym_days gd
JOIN session_templates st ON st.i18n_key = gd.type_label
WHERE wp.day = gd.day_key
  AND wp.template_id IS NULL;

-- 5b) weekly_plan
WITH lm(lc, i18n_key) AS (VALUES
  ('styrke','daytype.strength'),('strength','daytype.strength'),
  ('styrke kapasitet','daytype.strength_capacity'),('strength capacity','daytype.strength_capacity'),
  ('styrke power','daytype.strength_power'),('strength power','daytype.strength_power'),
  ('power','daytype.power'),
  ('sirkulasjon & mobilitet','daytype.mobility'),('mobility & conditioning','daytype.mobility'),
  ('kondisjon','daytype.conditioning'),('conditioning','daytype.conditioning'),
  ('rehab','daytype.rehab'),
  ('fotball','daytype.soccer'),('soccer','daytype.soccer'),
  ('basketball','daytype.basketball'),
  ('friidrett','daytype.track'),('track','daytype.track'),
  ('sprint','daytype.sprint')
)
UPDATE weekly_plan wp
SET template_id = st.id
FROM session_templates st
LEFT JOIN lm ON lm.i18n_key = st.i18n_key
WHERE wp.template_id IS NULL
  AND trim(wp.session_type) <> ''
  AND lower(trim(wp.session_type)) NOT IN ('hvile','rest')
  AND ( st.name = trim(wp.session_type)
     OR lm.lc  = lower(trim(wp.session_type)) );

-- 5c) training_plan_weekly (rad finnes = overstyring; '' = eksplisitt hvile)
WITH lm(lc, i18n_key) AS (VALUES
  ('styrke','daytype.strength'),('strength','daytype.strength'),
  ('styrke kapasitet','daytype.strength_capacity'),('strength capacity','daytype.strength_capacity'),
  ('styrke power','daytype.strength_power'),('strength power','daytype.strength_power'),
  ('power','daytype.power'),
  ('sirkulasjon & mobilitet','daytype.mobility'),('mobility & conditioning','daytype.mobility'),
  ('kondisjon','daytype.conditioning'),('conditioning','daytype.conditioning'),
  ('rehab','daytype.rehab'),
  ('fotball','daytype.soccer'),('soccer','daytype.soccer'),
  ('basketball','daytype.basketball'),
  ('friidrett','daytype.track'),('track','daytype.track'),
  ('sprint','daytype.sprint')
)
UPDATE training_plan_weekly tp
SET template_id = st.id
FROM session_templates st
LEFT JOIN lm ON lm.i18n_key = st.i18n_key
WHERE tp.template_id IS NULL
  AND trim(tp.session_text) <> ''
  AND lower(trim(tp.session_text)) NOT IN ('hvile','rest')
  AND ( st.name = trim(tp.session_text)
     OR lm.lc  = lower(trim(tp.session_text)) );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6) VERIFISERINGSRAPPORT (kjør og les output — ingen endring)
-- ─────────────────────────────────────────────────────────────────────────────
-- 6a) Hele biblioteket — se etter near-duplikater du vil slå sammen manuelt.
SELECT name, kind, i18n_key, is_protected, sort_order
FROM session_templates ORDER BY sort_order, name;

-- 6b) SIKKERHETSSJEKK — MÅ returnere 0 rader. Hvis noe dukker opp her, har en
--     ikke-tom plantekst ikke fått mal (= ville blitt stille hvile).
SELECT 'weekly_plan' AS src, day::text AS k, session_type AS txt
FROM weekly_plan
WHERE trim(session_type) <> '' AND lower(trim(session_type)) NOT IN ('hvile','rest')
  AND template_id IS NULL
UNION ALL
SELECT 'training_plan_weekly', week_monday::text || ' d' || day_index, session_text
FROM training_plan_weekly
WHERE trim(session_text) <> '' AND lower(trim(session_text)) NOT IN ('hvile','rest')
  AND template_id IS NULL;

-- 6c) workout_program-rader uten mal (forventet: kun warmup/friday_warmup).
SELECT DISTINCT day FROM workout_program WHERE template_id IS NULL ORDER BY day;
