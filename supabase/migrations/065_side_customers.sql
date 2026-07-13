-- 017_side_customers.sql
-- Kunderegister/regnskap for nettside-hustle-siden.
-- Følger samme mønster som todos: authenticated bruker full tilgang via RLS
-- (single-user app, service_role brukes ikke her — direkte klient-CRUD).

-- ── Kunder ───────────────────────────────────────────────────────────────
create table if not exists side_customers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  contact        text,                         -- tlf og/eller e-post, fritekst
  tier           text not null check (tier in ('lav','medium','hoy')),
  price_nok      numeric not null default 0,    -- kr/mnd
  start_date     date not null default current_date,
  binding_months int not null default 3,
  notes          text,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists side_customers_active_idx on side_customers (active);

-- ── Lovable-abonnement (én rad, fast id) ────────────────────────────────
create table if not exists lovable_subscription (
  id          int primary key default 1,
  credits     int not null default 100,
  price_eur   numeric not null default 25,
  updated_at  timestamptz not null default now(),
  constraint lovable_subscription_singleton check (id = 1)
);

insert into lovable_subscription (id, credits, price_eur)
values (1, 100, 25)
on conflict (id) do nothing;

-- ── updated_at auto-oppdatering ──────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_side_customers_updated on side_customers;
create trigger trg_side_customers_updated
  before update on side_customers
  for each row execute function set_updated_at();

drop trigger if exists trg_lovable_subscription_updated on lovable_subscription;
create trigger trg_lovable_subscription_updated
  before update on lovable_subscription
  for each row execute function set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table side_customers enable row level security;
alter table lovable_subscription enable row level security;

drop policy if exists "authenticated full access" on side_customers;
create policy "authenticated full access" on side_customers
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated full access" on lovable_subscription;
create policy "authenticated full access" on lovable_subscription
  for all
  to authenticated
  using (true)
  with check (true);
