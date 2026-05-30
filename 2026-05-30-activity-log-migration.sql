-- activity_log: logg for aktiviteter utenfor gym og sprint
-- Kjør dette i Supabase SQL Editor

create table if not exists activity_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  date            date not null,
  activity_type   text not null,           -- 'Soccer', 'Padel', 'Svømming', 'Løping', 'Annet' etc.
  activity_label  text,                    -- fritekst hvis type = 'Annet'
  duration_min    integer,                 -- varighet i minutter
  rpe             integer check (rpe between 1 and 10),
  knee_before     integer check (knee_before between 0 and 10),
  knee_during     integer check (knee_during between 0 and 10),
  knee_after      integer check (knee_after between 0 and 10),
  knee_day_after  integer check (knee_day_after between 0 and 10),
  notes           text,
  created_at      timestamptz default now()
);

-- RLS
alter table activity_log enable row level security;

create policy "Bruker ser egne aktiviteter"
  on activity_log for select
  using (auth.uid() = user_id);

create policy "Bruker oppretter egne aktiviteter"
  on activity_log for insert
  with check (auth.uid() = user_id);

create policy "Bruker oppdaterer egne aktiviteter"
  on activity_log for update
  using (auth.uid() = user_id);

create policy "Bruker sletter egne aktiviteter"
  on activity_log for delete
  using (auth.uid() = user_id);

-- Indeks for rask datosøk
create index if not exists activity_log_user_date on activity_log(user_id, date desc);
