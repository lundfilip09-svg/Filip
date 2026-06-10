-- 026_duration_min.sql
-- sRPE-belastning (Foster): last = varighet (min) × (RPE/10).
-- activity_log har allerede duration_min — gym_log og sprint_log mangler.
-- Gym fyller den automatisk fra økt-timeren ved lagring av økt.
-- Sprint får eget varighet-felt i loggskjemaet (samme verdi på alle løp den økta).
-- Kjør i Supabase SQL Editor FØR koden som skriver kolonnene deployes.

ALTER TABLE gym_log    ADD COLUMN IF NOT EXISTS duration_min integer;
ALTER TABLE sprint_log ADD COLUMN IF NOT EXISTS duration_min integer;
