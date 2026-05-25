alter table knee_pain add column if not exists created_at timestamptz default now();
