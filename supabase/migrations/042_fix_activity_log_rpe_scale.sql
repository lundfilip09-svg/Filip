-- 042_fix_activity_log_rpe_scale.sql
-- Definitiv fiks for activity_log.rpe-constrainten.
--
-- Bakgrunn:
--   * 032 (eneste CREATE TABLE for activity_log) definerer
--       rpe integer check (rpe between 1 and 10)
--   * Men appen lagrer RPE på 1–100-skala (se 018), f.eks. RPE 70.
--   * 029 fikset dette med en ALTER til 1–100 — MEN 029 er nummerert FØR
--     create-en i 032. Ved en frisk gjenoppbygging i rekkefølge kjøres 029
--     (ingen tabell ennå -> no-op/feil), deretter 032 som gjeninnfører
--     1–10-constrainten. Da feiler enhver insert med RPE > 10 igjen.
--
-- Denne migrasjonen er idempotent og rekkefølge-uavhengig: den dropper en evt.
-- eksisterende rpe-constraint og legger til 1–100-varianten. Trygg å kjøre når
-- som helst, og påvirker ingen eksisterende rader (data røres ikke).

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_rpe_check;
ALTER TABLE activity_log ADD  CONSTRAINT activity_log_rpe_check CHECK (rpe BETWEEN 1 AND 100);
