-- 016_gym_days.sql
-- A6: Redigerbare gym-dager. Brukerdefinerte dager som day-pills på gym-siden.
-- day_key er den stabile nøkkelen som workout_program.day refererer til.
-- weekday (0=søn..6=lør) brukes til auto-oversatt ukedagsnavn + sortering.
-- type_label er en i18n-nøkkel (f.eks 'daytype.strength') eller NULL.
-- is_protected = true for Rehab (kan ikke slettes).
-- NB: appen er enbruker (som workout_program), ingen user_id/RLS her.

CREATE TABLE IF NOT EXISTS gym_days (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_key     text NOT NULL UNIQUE,
  weekday     integer CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6)),
  type_label  text,
  is_protected boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0
);

-- Seed de eksisterende dagene slik at ingenting brytes.
-- day_key matcher de hardkodede nøklene som allerede ligger i workout_program.
INSERT INTO gym_days (day_key, weekday, type_label, is_protected, sort_order) VALUES
  ('monday',    1, 'daytype.strength_capacity', false, 0),
  ('wednesday', 3, 'daytype.mobility',          false, 1),
  ('friday',    5, 'daytype.strength_power',    false, 2),
  ('rehab',     NULL, 'daytype.rehab',          true,  99)
ON CONFLICT (day_key) DO NOTHING;
