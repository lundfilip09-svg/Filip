-- 059_activity_minutes_played.sql
-- N4: skille mellom total økt-varighet og faktiske spilte minutter i ballidrett
-- (fotball/basket/am. fotball). duration_min = total tid på trening/kamp;
-- minutes_played = minutter faktisk i spill (kamp). Nyttig for å vurdere
-- kne-belastning (retningsendring/hopp skjer i spill, ikke på benken).
-- Additiv kolonne på eksisterende RLS-sikret tabell → ingen ny policy nødvendig.

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS minutes_played integer;
