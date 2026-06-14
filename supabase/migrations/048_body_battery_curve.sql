-- 048: Intradags body battery-kurve fra Garmin (hele dagens avlesninger).
-- Lagres som JSON-array av [epoch_sekunder_GMT, nivå_0_100], slik at søvnsiden
-- kan tegne en linjegraf over body battery gjennom dagen.
-- Kjør i Supabase SQL Editor.

ALTER TABLE health_data ADD COLUMN IF NOT EXISTS body_battery_curve jsonb;
