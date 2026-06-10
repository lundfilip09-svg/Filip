-- 027_week_plan_presets.sql
-- Navngitte ukeplan-presets («Norge vår», «USA football», «USA soccer» …).
-- plan: jsonb { "0": "Styrke", ..., "6": "Hvile" } — dag 0=man … 6=søn,
-- samme nøkler som weekly_plan.day. «Bruk» fyller redigeringsskjemaet;
-- «Lagre plan» upserter weekly_plan som før.
-- Følger weekly_plan-mønsteret: user_id + RLS.

CREATE TABLE IF NOT EXISTS week_plan_presets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       text NOT NULL,
  plan       jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE week_plan_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own week plan presets" ON week_plan_presets
  FOR ALL USING (auth.uid() = user_id);
