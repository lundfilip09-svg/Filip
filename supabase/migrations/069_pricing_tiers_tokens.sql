-- 069_pricing_tiers_tokens.sql
-- Én kilde til sannhet for priser og juridisk scope.
-- contract_tokens for anon-lesbar kontraktvisning uten å lekke kundedata.
-- Kjør manuelt i Supabase SQL Editor.

-- ── pricing_tiers ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario     text        NOT NULL,            -- 'A', 'B', 'C'
  tier         text,                            -- NULL for A/B; 'Lav'/'Medium'/'Høy' for C
  pris_nok     numeric     NOT NULL DEFAULT 0,
  pris_til_nok numeric,                         -- øvre grense for prisintervall (kun A)
  enhet        text        NOT NULL DEFAULT 'engangs', -- 'mnd' | 'engangs' | 'time'
  beskrivelse  text        NOT NULL DEFAULT '',
  features     jsonb       NOT NULL DEFAULT '[]',  -- [{icon:'check'|'warn', key:'biz.sa_f1'}]
  juridisk_scope text      NOT NULL DEFAULT '',
  versjon      int         NOT NULL DEFAULT 1,
  gyldig_fra   date        NOT NULL DEFAULT current_date
);

CREATE INDEX IF NOT EXISTS pricing_tiers_scenario_idx ON public.pricing_tiers (scenario, tier);

-- Seed v1
INSERT INTO public.pricing_tiers
  (scenario, tier, pris_nok, pris_til_nok, enhet, beskrivelse, features, juridisk_scope, versjon, gyldig_fra)
VALUES

('A', NULL, 10000, 20000, 'engangs',
 'Kunden overtar prosjektet etter godkjent leveranse. Videre arbeid faktureres per time.',
 '[{"icon":"check","key":"biz.sa_f1"},{"icon":"check","key":"biz.sa_f2"},{"icon":"check","key":"biz.sa_f3"},{"icon":"warn","key":"biz.sa_f4"}]',
 'Leveransen omfatter design og oppsett av én komplett nettside. Før offisiell overføring skal kunden skriftlig godkjenne at leveransen oppfyller avtalte kriterier. Etter fullført «Transfer» i Lovable.dev overtar kunden løsningen fullt ut, reklamasjonsperioden avsluttes, og alt fremtidig arbeid eller support faktureres etter gjeldende timesats på 690 kr/t eks. mva.',
 1, current_date),

('B', NULL, 490, NULL, 'engangs',
 'Hosting via tredjepart. Ingen månedskostnad. Frie endringer de første 90 dagene, deretter gjelder gjenoppstartsgebyr.',
 '[{"icon":"check","key":"biz.sb_f1"},{"icon":"check","key":"biz.sb_f2"},{"icon":"check","key":"biz.sb_f3"},{"icon":"warn","key":"biz.sb_f4"}]',
 'Leveransen omfatter design og oppsett av én komplett nettside eksportert til gratis hosting via tredjepart (Cloudflare Pages / Vercel / Netlify). Innenfor de første 90 dagene etter signert overlevering («avtaledato») kan endringer avtales uten ekstra oppstartsgebyr. Etter utløpt 90-dagersfrist utløses automatisk et gjenoppstartsgebyr på 490 kr eks. mva per endringsforespørsel, i tillegg til ordinær timesats på 690 kr/t eks. mva (minimum 1 time). Gjenoppstartsgebyret inkluderer nødvendig gjennomgang av tidligere leveranse før arbeidet gjenopptas, og forfaller ved bestilling.',
 1, current_date),

('C', 'Lav', 690, NULL, 'mnd',
 'Hosting og SSL via tredjepart. Leverandøren overvåker og varsler ved avvik.',
 '[{"icon":"check","key":"biz.sc_lav_f1"},{"icon":"check","key":"biz.sc_lav_f2"},{"icon":"check","key":"biz.sc_lav_f3"},{"icon":"warn","key":"biz.sc_lav_f4"}]',
 'Leveransen omfatter løpende drift og hosting av nettsiden via tredjepart (Cloudflare Pages / Vercel / Netlify). For Lav-pakken (690 kr/mnd) dekkes utelukkende serverleie, SSL og overvåkning. Leverandøren overvåker nettsiden og varsler kunden ved kjente avvik. Teknisk support eller innholdsendringer er ikke inkludert og faktureres med gjeldende timesats på 690 kr/t eks. mva. Denne begrensningen gjelder utelukkende for nye avtaler og er ikke retroaktivt gjeldende for kunder med eldre avtaler.',
 1, current_date),

('C', 'Medium', 1190, NULL, 'mnd',
 'Alt i Lav + 3 inkluderte endringer per måned. Overforbruk: 1 050 kr/t.',
 '[{"icon":"check","key":"biz.sc_med_f1"},{"icon":"check","key":"biz.sc_med_f2"},{"icon":"warn","key":"biz.sc_med_f3"}]',
 'Leveransen omfatter løpende drift, hosting og månedlig vedlikehold via tredjepart. Medium-pakken (1 190 kr/mnd) inkluderer 3 små endringer per måned. Overforbruk utover inkludert kvote faktureres med 1 050 kr/t eks. mva, dokumentert med tidslogg.',
 1, current_date),

('C', 'Høy', 1990, NULL, 'mnd',
 'Alt i Medium + 1 oppdatering per uke. Overforbruk utover 1/uke: 1 050 kr/t.',
 '[{"icon":"check","key":"biz.sc_hoy_f1"},{"icon":"check","key":"biz.sc_hoy_f2"},{"icon":"warn","key":"biz.sc_hoy_f3"}]',
 'Leveransen omfatter løpende drift, hosting og ukentlig vedlikehold via tredjepart. Høy-pakken (1 990 kr/mnd) inkluderer 1 oppdatering per uke. Overforbruk utover én endring per uke faktureres med 1 050 kr/t eks. mva, dokumentert med tidslogg.',
 1, current_date);

-- RLS: authenticated full access, anon read-only
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.pricing_tiers;
CREATE POLICY "authenticated_full_access" ON public.pricing_tiers
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "anon_read_pricing" ON public.pricing_tiers;
CREATE POLICY "anon_read_pricing" ON public.pricing_tiers
  FOR SELECT USING (true);

-- ── contract_tokens ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_tokens (
  token       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid        NOT NULL REFERENCES public.business_customers(id) ON DELETE CASCADE,
  utlop_tid   timestamptz NOT NULL DEFAULT now() + interval '7 days',
  brukt       boolean     NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS contract_tokens_customer_idx ON public.contract_tokens (customer_id);

ALTER TABLE public.contract_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_tokens FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.contract_tokens;
CREATE POLICY "authenticated_full_access" ON public.contract_tokens
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
REVOKE ALL ON public.contract_tokens FROM anon;

-- ── RPC: anon kan hente én kunderad via gyldig token ──────────────────────────
CREATE OR REPLACE FUNCTION public.get_customer_by_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_result      jsonb;
BEGIN
  SELECT ct.customer_id INTO v_customer_id
  FROM public.contract_tokens ct
  WHERE ct.token = p_token
    AND ct.utlop_tid > now()
    AND ct.brukt = false;

  IF v_customer_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Token ugyldig eller utløpt');
  END IF;

  SELECT to_jsonb(c) INTO v_result
  FROM public.business_customers c
  WHERE c.id = v_customer_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_by_token(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_customer_by_token(uuid) TO authenticated;

-- ── Nye felt på business_customers ────────────────────────────────────────────
ALTER TABLE public.business_customers
  ADD COLUMN IF NOT EXISTS bekreftet_dato  date,
  ADD COLUMN IF NOT EXISTS contract_version int;
