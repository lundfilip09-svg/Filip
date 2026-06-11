-- 039: Rehabdag — bytt «Seteløft på matte» (redundant ved siden av SL Glute
-- Ham Bridge ISO) mot «Ankelstrekk mot vegg» (knee-to-wall, ankelmobilitet —
-- Havres rotårsak #1 for kneet). Kjør i Supabase SQL Editor.

DELETE FROM workout_program
WHERE day = 'rehab' AND exercise_name ILIKE 'Seteløft%';

INSERT INTO workout_program (day, section, exercise_name, sets, reps, sort_order)
SELECT 'rehab', 'Rehab', 'Ankelstrekk mot vegg (knee-to-wall)', 2, '12/side',
       COALESCE(MAX(sort_order), 0) + 1
FROM workout_program WHERE day = 'rehab'
AND NOT EXISTS (
  SELECT 1 FROM workout_program
  WHERE day = 'rehab' AND exercise_name ILIKE 'Ankelstrekk mot vegg%'
);

-- Verifiser:
SELECT exercise_name, sets, reps, sort_order
FROM workout_program WHERE day = 'rehab' ORDER BY sort_order;
