-- 029_activity_log_rpe_1_100.sql
-- activity_log was created with rpe check (1–10), but migration 018 converted
-- all values to a 1–100 scale. The constraint was never updated, so any new
-- insert with RPE > 10 fails. Drop the old constraint and re-add for 1–100.

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_rpe_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_rpe_check CHECK (rpe BETWEEN 1 AND 100);
