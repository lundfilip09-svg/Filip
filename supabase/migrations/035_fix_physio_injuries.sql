-- 1. Tabeller
CREATE TABLE IF NOT EXISTS physio_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  therapist text,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS physio_notes_date_idx ON physio_notes (date DESC);

CREATE TABLE IF NOT EXISTS injuries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body_part text NOT NULL,
  side text,
  status text NOT NULL DEFAULT 'active',
  severity text NOT NULL DEFAULT 'mild',
  start_date date,
  note text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS injuries_status_idx ON injuries (status, updated_at DESC);

-- 2. user_id-kolonner
ALTER TABLE physio_notes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE injuries     ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE physio_notes SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE injuries     SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

ALTER TABLE physio_notes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE injuries     ALTER COLUMN user_id SET NOT NULL;

-- 3. RLS
ALTER TABLE physio_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "physio_notes_owner" ON physio_notes;
CREATE POLICY "physio_notes_owner" ON physio_notes
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "injuries_owner" ON injuries;
CREATE POLICY "injuries_owner" ON injuries
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
