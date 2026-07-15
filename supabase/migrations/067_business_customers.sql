-- 067_business_customers.sql
-- Kundedatabase for business.html — erstatter localStorage med Supabase.
-- Kolonner matcher alle felt brukt i JS: businessModel, oneTimeFee, customScope osv.
-- Følger prosjektets RLS-mønster: authenticated full access, anon revoked.

CREATE TABLE IF NOT EXISTS public.business_customers (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text          NOT NULL DEFAULT '',
  contact        text          NOT NULL DEFAULT '',
  tier           text          NOT NULL DEFAULT 'Lav',
  business_model text          NOT NULL DEFAULT 'A',
  price          numeric       NOT NULL DEFAULT 0,
  one_time_fee   numeric       NOT NULL DEFAULT 0,
  start_date     date,
  status         text          NOT NULL DEFAULT 'Aktiv',
  notes          text          NOT NULL DEFAULT '',
  custom_scope   text          NOT NULL DEFAULT '',
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_customers_status_idx
  ON public.business_customers (status);

CREATE INDEX IF NOT EXISTS business_customers_created_idx
  ON public.business_customers (created_at);

-- Auto-oppdater updated_at ved PATCH
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_business_customers_updated ON public.business_customers;
CREATE TRIGGER trg_business_customers_updated
  BEFORE UPDATE ON public.business_customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS — følger mønsteret fra 052_enable_rls_all_tables.sql
ALTER TABLE public.business_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_customers FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_full_access" ON public.business_customers;
CREATE POLICY "authenticated_full_access" ON public.business_customers
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

REVOKE ALL ON public.business_customers FROM anon;
