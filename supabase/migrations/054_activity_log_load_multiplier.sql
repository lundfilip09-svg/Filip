-- 054_activity_log_load_multiplier.sql
-- Legger til load_multiplier på activity_log slik at brukeren kan overstyre
-- den hardkodede aktivitetsvekten per økt. Backfiller eksisterende rader med
-- type-defaulten fra loadMultiplier() i utils.js — historisk ukeslast endres ikke.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + WHERE load_multiplier IS NULL.

ALTER TABLE public.activity_log
  ADD COLUMN IF NOT EXISTS load_multiplier numeric;

-- Backfill: samme CASE-logikk som loadMultiplier('activity', ...) i utils.js
UPDATE public.activity_log
SET load_multiplier = CASE
  WHEN lower(activity_type) ~ 'fotball|soccer' AND activity_label = 'lav'     THEN 1.5
  WHEN lower(activity_type) ~ 'fotball|soccer' AND activity_label = 'middels' THEN 2.25
  WHEN lower(activity_type) ~ 'fotball|soccer'                                 THEN 3.0
  WHEN lower(activity_type) ~ 'padel|padle'                                   THEN 3.0
  WHEN lower(activity_type) ~ 'basket'                                         THEN 3.0
  WHEN lower(activity_type) ~ 'løp|jog|run'                                   THEN 1.5
  WHEN lower(activity_type) ~ 'svøm|swim|sykl|cycl|bike|ellipse|rehab'        THEN 1.0
  WHEN lower(activity_type) ~ 'rolig|lett|easy'                               THEN 1.5
  ELSE 1.5
END
WHERE load_multiplier IS NULL;
