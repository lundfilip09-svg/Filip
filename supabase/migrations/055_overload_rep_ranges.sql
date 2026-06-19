-- 055_overload_rep_ranges.sql
-- Seeder rep-intervall i overload_config for alle hovedøvelser, tunet for en
-- sprinter (styrke 2x/uke ved siden av 2-3 sprintøkter): LAVE reps = lav fatigue
-- → bevarer CNS/sprintkvalitet. Filip kjører 3 RIR, så progresjonen er
-- autoregulert: treffer han rep-toppen MED 3 RIR → øk vekt (han velger steget selv).
--
-- Rehab/sene-øvelser (1-beins leg extension, eksentrisk tåhev) ligger litt høyere
-- (HSR-stil, kontrollert) pga. patellar/akilles-sene.
--
-- Idempotent: ON CONFLICT oppdaterer kun rep-feltene + enabled, lar step_kg /
-- pain_limit stå. Trygg å kjøre flere ganger.

INSERT INTO overload_config (exercise_name, rep_min, rep_max, enabled) VALUES
  ('Squats',              3, 5,  true),   -- ren styrke, lav beinfatigue
  ('Bench press',         4, 6,  true),   -- overkropp styrke
  ('Weighted pull ups',   3, 5,  true),   -- relativ styrke
  ('RDL',                 5, 7,  true),   -- bakkjede/hamstring, kontrollert
  ('Hip thrust',          6, 8,  true),   -- glutea-power, lav ryggkostnad
  ('Leg extension 1 bein',6, 8,  true),   -- patellarsene HSR, 1-beins kontroll
  ('Eksentrisk tåhev',    8, 10, true)    -- akillessene, eksentrisk
ON CONFLICT (exercise_name) DO UPDATE SET
  rep_min    = EXCLUDED.rep_min,
  rep_max    = EXCLUDED.rep_max,
  enabled    = true,
  updated_at = now();
