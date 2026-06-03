-- 025_physio_injuries_user_id.sql
-- Legg til user_id + RLS på physio_notes og injuries

ALTER TABLE physio_notes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE injuries     ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Oppdater eksisterende rader til første bruker (enkeltbrukersystem)
UPDATE physio_notes SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE injuries     SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

ALTER TABLE physio_notes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE injuries     ALTER COLUMN user_id SET NOT NULL;

-- RLS
ALTER TABLE physio_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries     ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "physio_notes_owner" ON physio_notes
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "injuries_owner" ON injuries
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
