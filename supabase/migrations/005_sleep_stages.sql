-- Søvnfaser fra Garmin Connect
alter table health_data add column if not exists deep_sleep_minutes  integer;
alter table health_data add column if not exists light_sleep_minutes integer;
alter table health_data add column if not exists rem_sleep_minutes   integer;
alter table health_data add column if not exists awake_minutes       integer;
alter table health_data add column if not exists sleep_start         text;   -- HH:MM
alter table health_data add column if not exists sleep_end           text;   -- HH:MM

-- Manglende kolonner fra zepp-data-endepunktet
alter table health_data add column if not exists steps        integer;
alter table health_data add column if not exists body_battery integer;
