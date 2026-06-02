-- Add baseline_time to sprint_records so users can reset the progress bar start point
-- per distance without losing their actual PB.
ALTER TABLE sprint_records ADD COLUMN IF NOT EXISTS baseline_time NUMERIC;
