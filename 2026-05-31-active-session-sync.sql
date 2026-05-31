-- active_session: synker pågående trenings-/sprintøkt på tvers av enheter.
-- Én rad per bruker (user_id unik). Lagrer hele økt-tilstanden som JSON.
-- Kjør dette i Supabase SQL Editor.

create table if not exists active_session (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  kind        text not null,            -- 'gym' eller 'sprint'
  state       jsonb not null,           -- hele session-bloben (samme som localStorage)
  updated_at  timestamptz default now() not null
);

alter table active_session enable row level security;

create policy "Bruker ser egen aktiv økt"
  on active_session for select using (auth.uid() = user_id);
create policy "Bruker lagrer egen aktiv økt"
  on active_session for insert with check (auth.uid() = user_id);
create policy "Bruker oppdaterer egen aktiv økt"
  on active_session for update using (auth.uid() = user_id);
create policy "Bruker sletter egen aktiv økt"
  on active_session for delete using (auth.uid() = user_id);
