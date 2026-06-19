-- 056_overload_rir.sql
-- RIR-aware Progressive Overload-coach.
--   set_log.rir          = logget innsats per øvelse (reps i reserve, 0–5).
--                          Denormalisert på hver settrad for øvelsen (samme mønster
--                          som knee_max) → coachen slipper join mot gym_log.
--   overload_config.target_rir = mål-RIR per øvelse (default 3). Tung squat kan
--                          ha 3 (skåne patellasene), isolasjon kan kjøre 1–2.
--
-- Coachen leser rir for å variere anbefalingen begge veier: traff rep-toppen på
-- 0–1 RIR (grinding) → IKKE øk vekt; lett (≥ mål+1) under reps → for lett, press.
--
-- Begge tabeller har allerede RLS (set_log via 052, overload_config via 049) —
-- å legge til kolonner endrer ikke RLS. Idempotent: trygg å kjøre flere ganger.

ALTER TABLE set_log        ADD COLUMN IF NOT EXISTS rir        numeric;
ALTER TABLE overload_config ADD COLUMN IF NOT EXISTS target_rir numeric DEFAULT 3;

-- Eksisterende rader: sett mål-RIR til 3 der det er null (default gjelder kun nye rader).
UPDATE overload_config SET target_rir = 3 WHERE target_rir IS NULL;
