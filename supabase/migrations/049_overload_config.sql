-- 049_overload_config.sql
-- Konfigurerbar Progressive Overload-coach: per-øvelse overrides for vektsteg,
-- smertegrense, rep-intervall og aktivering. Ingen user_id (enbruker-app,
-- same mønster som set_log / workout_program).
-- Idempotent: trygg å kjøre flere ganger.

CREATE TABLE IF NOT EXISTS overload_config (
  exercise_name text PRIMARY KEY,
  rep_min       integer,               -- overstyrer intervall fra workout_program.reps (null = bruk WP)
  rep_max       integer,
  step_kg       numeric DEFAULT 2.5,   -- vektøkning når intervall-toppen nås
  pain_limit    integer DEFAULT 3,     -- knee_max-grense som stopper progresjon
  enabled       boolean DEFAULT true,  -- false → coachen hopper over øvelsen
  updated_at    timestamptz DEFAULT now()
);

-- ─── RLS — nøyaktig samme mønster som injury_pain (043) ──────────────────────
ALTER TABLE overload_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE overload_config FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_full_access" ON overload_config;
CREATE POLICY "authenticated_full_access" ON overload_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON overload_config TO authenticated;
