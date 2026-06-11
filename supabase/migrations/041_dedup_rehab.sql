-- 041: Rydd duplikate rehab-øvelser i workout_program.
-- Duplikater oppsto fordi seedRehabIfEmpty() kjørte på nytt når program-
-- spørringen feilet/kom tom tilbake (fikset i gym.html samtidig).
-- Beholder ÉN rad per øvelsesnavn (case-insensitivt) — den med lavest
-- sort_order, tie-break på id. Kjør i Supabase SQL Editor.

DELETE FROM workout_program wp
USING workout_program keep
WHERE wp.day = 'rehab'
  AND keep.day = 'rehab'
  AND lower(wp.exercise_name) = lower(keep.exercise_name)
  AND (keep.sort_order, keep.id::text) < (wp.sort_order, wp.id::text);

-- Normaliser navn/reps til 039-varianten:
UPDATE workout_program
SET exercise_name = 'Ankelstrekk mot vegg (knee-to-wall)', reps = '12/side'
WHERE day = 'rehab' AND exercise_name ILIKE 'Ankelstrekk mot vegg%';

-- Verifiser (forvent én rad per navn):
SELECT exercise_name, sets, reps, sort_order
FROM workout_program WHERE day = 'rehab' ORDER BY sort_order;
