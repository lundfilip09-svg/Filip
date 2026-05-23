create table health_data (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  sleep_hours numeric,
  sleep_score integer,
  hrv numeric,
  sleep_onset_minutes integer,
  rhr integer,
  mood integer,
  timestamp timestamptz default now()
);

create table knee_pain (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  session_type text,
  before_score integer,
  during_score integer,
  after_score integer,
  day_after_score integer,
  notes text
);

create table gym_log (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  session_type text,
  session_notes text
);

create table exercise_weights (
  id uuid default gen_random_uuid() primary key,
  exercise_name text unique not null,
  weight_kg numeric,
  updated_at timestamptz default now()
);

create table workout_program (
  id uuid default gen_random_uuid() primary key,
  day text not null,
  section text not null,
  exercise_name text not null,
  sets integer,
  reps text,
  sort_order integer default 0
);

create table sprint_log (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  distance text,
  type text,
  knee_before integer,
  knee_during integer,
  knee_after integer,
  knee_day_after integer,
  rpe integer,
  notes text
);

create table sprint_records (
  distance text primary key,
  best_time numeric,
  date date
);

create table todos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  list_name text not null default 'Generelt',
  due_date date,
  important boolean default false,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ── Seed data ────────────────────────────────────────────────────────────────

-- Sprint records (Filip's PBs)
insert into sprint_records (distance, best_time, date) values
  ('60m',  6.99,  '2026-04-12'),
  ('100m', 11.52, '2026-05-09'),
  ('150m', 15.00, '2026-05-22'),
  ('200m', 23.11, '2026-05-10');

-- Workout program
insert into workout_program (day, section, exercise_name, sets, reps, sort_order) values
  -- Oppvarming alle dager
  ('warmup', 'Sykkel',          'Sykkel',                        1, '8–10 min',      0),
  ('warmup', 'Hofteaktivering', 'Hip thrust 1 fot',              2, '1–2×10',        10),
  ('warmup', 'Hofteaktivering', 'Miniband walk',                 2, '1–2×10',        11),
  ('warmup', 'Hofteaktivering', 'Psoas march',                   2, '1–2×10',        12),
  ('warmup', 'Knær',            'Spanish squat ISO',             2, '1–2×20–30sek',  20),
  ('warmup', 'Knær',            'TKE',                           2, '1–2×10',        21),
  ('warmup', 'Knær',            'Tib raises',                    2, '1–2×12–15',     22),
  -- Oppvarming fredag (erstatter sykkel 8-10 min)
  ('friday_warmup', 'Sykkel',   'Sykkel',                        1, '5–8 min',       0),
  ('friday_warmup', 'Ekstra',   'Backwards treadmill walk',      1, '2–3 min',       1),
  ('friday_warmup', 'Ekstra',   'Sled pull',                     4, '15–20m',        2),
  -- Mandag – Styrke Kapasitet
  ('monday', 'Bein',       'Hip thrust',              4, '5',       0),
  ('monday', 'Bein',       'Leg extension 1 bein',    3, '6–8',     1),
  ('monday', 'Bein',       'Hamstring curl',           3, '6–8',     2),
  ('monday', 'Bein',       'Standing calf raise',      3, '6–8',     3),
  ('monday', 'Bein',       'Seated calf raise',        3, '10–12',   4),
  ('monday', 'Overkropp',  'Weighted chin-ups',        4, '4–6',     10),
  ('monday', 'Overkropp',  'Incline dumbbell press',   3, '5–6',     11),
  ('monday', 'Overkropp',  'Chest-supported row',      3, '6–8',     12),
  ('monday', 'Overkropp',  'Face pulls',               3, '10–12',   13),
  ('monday', 'Kjerne',     'Hanging knee raise',       3, '8–10',    20),
  ('monday', 'Kjerne',     'Pallof press',             3, '8/side',  21),
  -- Onsdag – Sirkulasjon og mobilitet
  ('wednesday', 'Kondisjon',  'Sykkel/ellipse',              1, '20–25 min rolig', 0),
  ('wednesday', 'Mobilitet',  'Hofte og rygg',               1, '10 min',          10),
  ('wednesday', 'Aktivering', 'Spanish squat ISO',           3, '20–30sek',        20),
  ('wednesday', 'Aktivering', 'Tib raises',                  3, '12–15',           21),
  ('wednesday', 'Aktivering', 'Standing calf raise',         2, '10',              22),
  ('wednesday', 'Aktivering', 'Sideliggende abduksjon',      2, '10–12',           23),
  ('wednesday', 'Kjerne',     'Dead bug',                    3, '6/side',          30),
  ('wednesday', 'Kjerne',     'Side plank',                  2, '30–45sek',        31),
  -- Fredag – Styrke Power
  ('friday', 'Bein',      'Leg extension 1 bein',    4, '5',       0),
  ('friday', 'Bein',      'Hip thrust',              5, '3',       1),
  ('friday', 'Bein',      'Squats',                  2, '5–6',     2),
  ('friday', 'Bein',      'RDL',                     4, '5–6',     3),
  ('friday', 'Bein',      'Standing calf raise',     5, '4–6',     4),
  ('friday', 'Bein',      'Seated calf raise',       3, '8–10',    5),
  ('friday', 'Overkropp', 'Explosive bench press',   4, '4–6',     10),
  ('friday', 'Overkropp', 'Weighted pull ups',       3, '3–5',     11),
  ('friday', 'Overkropp', 'Landmine press',          3, '5/side',  12),
  ('friday', 'Overkropp', 'High cable row',          3, '6–8',     13),
  ('friday', 'Kjerne',    'Hanging leg raise',       3, '6–8',     20),
  ('friday', 'Kjerne',    'Cable chop',              3, '6/side',  21);

-- Default weights
insert into exercise_weights (exercise_name, weight_kg) values
  ('Hip thrust',             120),
  ('Leg extension 1 bein',    30),
  ('Hamstring curl',          22.5),
  ('Standing calf raise',     30),
  ('Seated calf raise',       30),
  ('Weighted chin-ups',       10),
  ('Incline dumbbell press',  15),
  ('Chest-supported row',     20),
  ('Face pulls',              12.5),
  ('Explosive bench press',   17.5),
  ('Cable chop',              20),
  ('RDL',                     60)
on conflict (exercise_name) do nothing;
