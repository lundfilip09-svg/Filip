-- 022_gym_log_rpe.sql
-- Legg RPE (1–100) på gym-økter. Gir reell belastningsmåling for styrke
-- (før antok ACWR-beregningen en fast verdi). Brukes av coach + AI-Overseer.

ALTER TABLE gym_log ADD COLUMN IF NOT EXISTS rpe integer;
