-- 068_add_deposit_paid.sql
-- Legger til deposit_paid-flagg på business_customers.
-- Kjør manuelt i Supabase SQL Editor.

ALTER TABLE public.business_customers
  ADD COLUMN IF NOT EXISTS deposit_paid boolean NOT NULL DEFAULT false;
