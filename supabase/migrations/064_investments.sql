-- 053_investments.sql
-- NB: bekreft selv at "053" er neste ledige migrasjonsnummer i prosjektet.
-- Investeringsjournal: aksjer/fond (Nordnet). Single-user app, samme
-- RLS-mønster som 052_enable_rls_all_tables.sql (auth.role()='authenticated').

create table if not exists investments (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  name text,
  status text not null default 'watchlist' check (status in ('watchlist','open','closed')),
  is_favorite boolean default false,
  locked boolean default false,

  thesis_why text,
  thesis_catalyst text,
  thesis_horizon text,
  thesis_must_happen text,

  ta_trend text,
  ta_support numeric,
  ta_resistance numeric,
  ta_volume_comment text,
  ta_rsi numeric,
  ta_macd text,
  ta_comment text,

  plan_entry numeric,
  plan_stop_loss numeric,
  plan_target_1 numeric,
  plan_target_2 numeric,
  plan_horizon text,

  risk_what_could_go_wrong text,
  risk_sell_trigger text,
  risk_buy_more_trigger text,

  buy_date date,
  buy_price numeric,
  quantity numeric,
  commission_buy numeric,

  sell_date date,
  sell_price numeric,
  quantity_sold numeric,
  commission_sell numeric,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references investments(id) on delete cascade,
  type text not null check (type in ('note','buy','sell','update','stop_loss','target_hit')),
  title text,
  description text,
  created_at timestamptz default now()
);

create index if not exists journal_entries_investment_id_idx on journal_entries(investment_id);

-- RLS — samme mønster som 052_enable_rls_all_tables.sql
alter table investments     enable row level security;
alter table investments     force row level security;
alter table journal_entries enable row level security;
alter table journal_entries force row level security;

drop policy if exists "authenticated_full_access" on investments;
create policy "authenticated_full_access" on investments
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on journal_entries;
create policy "authenticated_full_access" on journal_entries
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

revoke all on investments from anon;
revoke all on journal_entries from anon;
