-- Enable RLS
alter table health_data      enable row level security;
alter table knee_pain        enable row level security;
alter table gym_log          enable row level security;
alter table exercise_weights enable row level security;

-- Allow all operations for authenticated users (single-user dashboard)
create policy "authenticated_full_access" on health_data
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on knee_pain
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on gym_log
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on exercise_weights
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
