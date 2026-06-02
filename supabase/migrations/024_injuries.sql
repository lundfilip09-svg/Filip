-- 024_injuries.sql
-- Plageliste/skadeliste som Filip styrer selv. Erstatter hardkodet skadeinfo i
-- AI-prompten. AI-Overseer leser aktive + bedring-plager inn i konteksten.
-- status: 'active' | 'improving' | 'archived'
-- severity: 'mild' | 'moderate' | 'severe'

CREATE TABLE IF NOT EXISTS injuries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body_part   text NOT NULL,          -- i18n-nøkkel (f.eks 'body.knee') eller fritekst
  side        text,                   -- 'left' | 'right' | 'both' | null
  status      text NOT NULL DEFAULT 'active',
  severity    text NOT NULL DEFAULT 'mild',
  start_date  date,
  note        text,
  updated_at  timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS injuries_status_idx ON injuries (status, updated_at DESC);
