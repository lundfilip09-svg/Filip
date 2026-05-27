-- Migration 006: calendar_events table
-- Used by kalender.html to store custom user events

create table if not exists calendar_events (
  id          uuid        default gen_random_uuid() primary key,
  title       text        not null,
  date        date        not null,
  start_time  text,
  end_time    text,
  all_day     boolean     default false,
  category    text        default 'other',
  notes       text,
  created_at  timestamptz default now()
);

alter table calendar_events enable row level security;

create policy "authenticated_full_access" on calendar_events
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
