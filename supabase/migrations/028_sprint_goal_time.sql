-- Add goal_time to sprint_records so the target time per distance is editable
-- from the Sprint page. Falls back to the hard-coded GOALS default when null.
ALTER TABLE sprint_records ADD COLUMN IF NOT EXISTS goal_time NUMERIC;
