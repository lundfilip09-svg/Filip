-- 065_investment_lots.sql
-- NB: bekreft selv at "065" er neste ledige migrasjonsnummer i prosjektet.
-- Full kjøpshistorikk: flere kjøp (lots) per investering, i stedet for
-- enkelt-felt buy_price/quantity på investments. Salg trekker FIFO fra lots.
-- Samme RLS-mønster som 064_investments.sql.

create table if not exists investment_lots (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references investments(id) on delete cascade,
  buy_date date not null,
  buy_price numeric not null,
  quantity numeric not null,
  quantity_remaining numeric not null,
  commission_buy numeric default 0,
  created_at timestamptz default now()
);

create index if not exists investment_lots_investment_id_idx on investment_lots(investment_id);

create table if not exists investment_sales (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references investments(id) on delete cascade,
  sell_date date not null,
  sell_price numeric not null,
  quantity_sold numeric not null,
  commission_sell numeric default 0,
  created_at timestamptz default now()
);

create index if not exists investment_sales_investment_id_idx on investment_sales(investment_id);

-- RLS — samme mønster som 064_investments.sql
alter table investment_lots  enable row level security;
alter table investment_lots  force row level security;
alter table investment_sales enable row level security;
alter table investment_sales force row level security;

drop policy if exists "authenticated_full_access" on investment_lots;
create policy "authenticated_full_access" on investment_lots
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "authenticated_full_access" on investment_sales;
create policy "authenticated_full_access" on investment_sales
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

revoke all on investment_lots from anon;
revoke all on investment_sales from anon;

-- Migrer ev. eksisterende enkelt-kjøp fra investments-tabellen inn i investment_lots,
-- slik at gamle posisjoner ikke mister historikk.
insert into investment_lots (investment_id, buy_date, buy_price, quantity, quantity_remaining, commission_buy)
select id, buy_date, buy_price, quantity,
       greatest(quantity - coalesce(quantity_sold, 0), 0),
       coalesce(commission_buy, 0)
from investments
where buy_price is not null and quantity is not null and buy_date is not null;

insert into investment_sales (investment_id, sell_date, sell_price, quantity_sold, commission_sell)
select id, sell_date, sell_price, quantity_sold, coalesce(commission_sell, 0)
from investments
where sell_price is not null and quantity_sold is not null and sell_date is not null;