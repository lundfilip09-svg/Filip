-- Migration 009: add exercise_id to exercise_weights
-- Allows keying weights by workout_program.id instead of exercise_name.

alter table exercise_weights
  add column if not exists exercise_id uuid references workout_program(id) on delete cascade;

-- Backfill exercise_id from existing exercise_name matches
update exercise_weights ew
set exercise_id = wp.id
from workout_program wp
where wp.exercise_name = ew.exercise_name
  and ew.exercise_id is null;

-- Unique index on exercise_id (partial — allows null for legacy rows)
create unique index if not exists exercise_weights_exercise_id_idx
  on exercise_weights (exercise_id)
  where exercise_id is not null;
