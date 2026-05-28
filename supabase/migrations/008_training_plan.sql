-- Migration 008: training_plan table
-- Replaces localStorage-based treningsplan_v1.
-- Stores one row per day-of-week (0=Mon … 6=Sun) per user.

create table if not exists training_plan (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  day_index    integer     not null check (day_index between 0 and 6),
  session_text text        not null default '',
  notes        text        not null default '',
  updated_at   timestamptz default now(),
  unique (user_id, day_index)
);

alter table training_plan enable row level security;

create policy "owner_full_access" on training_plan
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
