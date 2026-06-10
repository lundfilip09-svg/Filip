-- 030: Ukesrapporter (AI) — én rad per bruker per uke (uke = søndag–lørdag,
-- week_start er søndagen). Genereres av cron lørdag morgen, NO+EN i samme kall.
create table if not exists weekly_summaries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  week_start  date not null,
  content_no  text,
  content_en  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table weekly_summaries enable row level security;

create policy "weekly_summaries_own"
  on weekly_summaries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
