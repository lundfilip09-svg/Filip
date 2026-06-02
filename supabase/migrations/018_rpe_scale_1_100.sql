-- 018_rpe_scale_1_100.sql
-- B2: Bytt RPE-skala fra 1–10 til 1–100 i hele appen.
-- Eksisterende verdier konverteres ×10 (RPE 7 → 70) slik at historikk/grafer
-- forblir konsistente med den nye skalaen.
-- NB: Knesmerte (knee_*-kolonner) er IKKE RPE og skal forbli 0–10. Røres ikke.
-- Konverter bare verdier som ligger i den gamle 1–10-skalaen (<= 10), slik at
-- migrasjonen er idempotent (kjøres den to ganger, dobbelt-skaleres ikke data
-- som allerede er 1–100).

UPDATE sprint_log
  SET rpe = rpe * 10
  WHERE rpe IS NOT NULL AND rpe <= 10;

UPDATE activity_log
  SET rpe = rpe * 10
  WHERE rpe IS NOT NULL AND rpe <= 10;
