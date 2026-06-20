-- 057_session_templates_cleanup.sql
-- Rydder mal-biblioteket (session_templates):
--   • fjerner near-duplikat + engangs-stevne-maler
--   • innfører én generisk «Stevne»-mal (i18n_key daytype.meet, no «Stevne» / en «Competition»)
--
-- ⚠️ FK-er på session_templates:
--   workout_program.template_id      ON DELETE CASCADE   (kan dra med øvelser!)
--   weekly_plan.template_id          ON DELETE RESTRICT  (blokkerer sletting)
--   training_plan_weekly.template_id ON DELETE RESTRICT  (blokkerer sletting)
-- Derfor REPOINTES alle referanser til en levende mal FØR sletting:
--   «Mobilitet og kondisjon» -> Sirkulasjon & Mobilitet (daytype.mobility)
--   «200m/60m stevne …»      -> Stevne
-- Etter repoint har ingen rad lenger en doomed template_id ⇒ ingen CASCADE,
-- ingen RESTRICT. Tekst-snapshots (session_type / session_text) RØRES IKKE, så
-- gamle uker som sier «200m stevne …» beholder teksten — kun mal-koblingen flyttes.
--
-- Idempotent: trygg å kjøre flere ganger.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Ny «Stevne»-mal (vises tospråklig via daytype.meet).
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO session_templates (name, kind, i18n_key, is_protected, sort_order)
VALUES ('Stevne', 'sprint', 'daytype.meet', false, 60)
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Repoint alle referanser doomed -> target i de tre tabellene.
--    map: doomed-navn -> target-id
-- ─────────────────────────────────────────────────────────────────────────────
WITH remap AS (
  SELECT d.id AS doomed_id,
         CASE WHEN d.name = 'Mobilitet og kondisjon'
              THEN (SELECT id FROM session_templates WHERE i18n_key = 'daytype.mobility' LIMIT 1)
              ELSE (SELECT id FROM session_templates WHERE name = 'Stevne' LIMIT 1)
         END AS target_id
  FROM session_templates d
  WHERE d.name IN ('200m stevne - Framolekene', '60m stevne - Framolekene', 'Mobilitet og kondisjon')
)
UPDATE workout_program x SET template_id = r.target_id
FROM remap r WHERE x.template_id = r.doomed_id;

WITH remap AS (
  SELECT d.id AS doomed_id,
         CASE WHEN d.name = 'Mobilitet og kondisjon'
              THEN (SELECT id FROM session_templates WHERE i18n_key = 'daytype.mobility' LIMIT 1)
              ELSE (SELECT id FROM session_templates WHERE name = 'Stevne' LIMIT 1)
         END AS target_id
  FROM session_templates d
  WHERE d.name IN ('200m stevne - Framolekene', '60m stevne - Framolekene', 'Mobilitet og kondisjon')
)
UPDATE weekly_plan x SET template_id = r.target_id
FROM remap r WHERE x.template_id = r.doomed_id;

WITH remap AS (
  SELECT d.id AS doomed_id,
         CASE WHEN d.name = 'Mobilitet og kondisjon'
              THEN (SELECT id FROM session_templates WHERE i18n_key = 'daytype.mobility' LIMIT 1)
              ELSE (SELECT id FROM session_templates WHERE name = 'Stevne' LIMIT 1)
         END AS target_id
  FROM session_templates d
  WHERE d.name IN ('200m stevne - Framolekene', '60m stevne - Framolekene', 'Mobilitet og kondisjon')
)
UPDATE training_plan_weekly x SET template_id = r.target_id
FROM remap r WHERE x.template_id = r.doomed_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Slett malene (ingen referanser igjen).
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM session_templates
WHERE name IN ('200m stevne - Framolekene', '60m stevne - Framolekene', 'Mobilitet og kondisjon');

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) VERIFISERING — les output. Skal vise det ryddede biblioteket m/ «Stevne».
-- ─────────────────────────────────────────────────────────────────────────────
SELECT name, kind, i18n_key, is_protected, sort_order
FROM session_templates ORDER BY sort_order, name;
