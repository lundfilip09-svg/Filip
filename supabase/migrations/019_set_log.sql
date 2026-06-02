-- 019_set_log.sql
-- B1: Progressive Overload-coach trenger sett-for-sett-historikk per øvelse.
-- Hver fullførte serie i en gym-økt lagres her ved lagring av økta.
-- Coachen leser denne for å foreslå neste vekt/reps og oppdage platå.
-- knee_max = høyeste knesmerte logget den økta (0–10) → coachen holder igjen
-- progresjon hvis smerte var over terskel.
-- NB: enbruker-app (som workout_program), ingen user_id/RLS.

CREATE TABLE IF NOT EXISTS set_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date NOT NULL,
  day_key       text,
  exercise_name text NOT NULL,
  weight_kg     numeric,
  reps          text,
  set_index     integer,
  knee_max      integer,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS set_log_exercise_idx ON set_log (exercise_name, date DESC);
