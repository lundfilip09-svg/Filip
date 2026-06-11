-- 040: Stress fra Garmin i health_data (snitt for dagen, 0–100).
-- (Training Readiness/restitusjonstid droppet — Venu 3 støtter det ikke.)
-- Kjør i Supabase SQL Editor.

ALTER TABLE health_data ADD COLUMN IF NOT EXISTS stress_avg integer;
