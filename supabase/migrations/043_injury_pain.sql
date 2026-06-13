-- 043_injury_pain.sql
-- Generisk per-skade smertelogg. Erstatter hardkodet knee_pain-sporing med en
-- tabellbasert modell som funker for enhver alvorlig skade i injuries-tabellen.
-- knee_pain og sprint_log.knee_*-kolonner beholdes som sikkerhetsnett.
-- Idempotent: trygg å kjøre flere ganger uten duplikater.

-- ─── 1. Opprett tabell ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS injury_pain (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  injury_id       uuid REFERENCES injuries(id) ON DELETE CASCADE,
  date            date NOT NULL,
  session_type    text,
  source          text,        -- 'sprint' | 'gym' | 'manual' | 'legacy_knee_pain' | 'legacy_sprint'
  before_score    integer,
  during_score    integer,
  after_score     integer,
  day_after_score integer,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS injury_pain_injury_date_idx ON injury_pain (injury_id, date DESC);

-- ─── 2. RLS — nøyaktig samme mønster som knee_pain (003 + 031) ───────────────
ALTER TABLE injury_pain ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_pain FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_full_access" ON injury_pain;
CREATE POLICY "authenticated_full_access" ON injury_pain
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

REVOKE ALL ON injury_pain FROM anon;

-- ─── 3. Sørg for kne-skaderad + backfill all eksisterende kne-data ────────────
DO $$
DECLARE
  v_injury_id uuid;
BEGIN
  -- Finn eksisterende kne-skade (body_part eller note matcher)
  SELECT id INTO v_injury_id
  FROM injuries
  WHERE body_part ILIKE '%kne%'
     OR body_part ILIKE '%knee%'
     OR body_part = 'body.knee'
     OR note ILIKE '%patellar%'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Opprett rad hvis den ikke finnes
  IF v_injury_id IS NULL THEN
    INSERT INTO injuries (body_part, side, status, severity, start_date, note, user_id)
    VALUES (
      'body.knee', 'left', 'active', 'severe', '2026-01-09',
      'Patellar tendinopati',
      (SELECT id FROM auth.users LIMIT 1)
    )
    RETURNING id INTO v_injury_id;
  END IF;

  -- Backfill fra knee_pain
  -- NOT EXISTS på (source, injury_id, date) sikrer idempotens
  INSERT INTO injury_pain (
    injury_id, date, session_type, source,
    before_score, during_score, after_score, day_after_score, notes
  )
  SELECT
    v_injury_id,
    kp.date,
    kp.session_type,
    'legacy_knee_pain',
    kp.before_score,
    kp.during_score,
    kp.after_score,
    kp.day_after_score,
    kp.notes
  FROM knee_pain kp
  WHERE NOT EXISTS (
    SELECT 1 FROM injury_pain ip2
    WHERE ip2.source    = 'legacy_knee_pain'
      AND ip2.injury_id = v_injury_id
      AND ip2.date      = kp.date
  );

  -- Backfill fra sprint_log (kun rader med minst én knee-score satt)
  -- NOT EXISTS på (source, injury_id, date) sikrer idempotens
  INSERT INTO injury_pain (
    injury_id, date, session_type, source,
    before_score, during_score, after_score, day_after_score, notes
  )
  SELECT
    v_injury_id,
    sl.date,
    'sprint',
    'legacy_sprint',
    sl.knee_before,
    sl.knee_during,
    sl.knee_after,
    sl.knee_day_after,
    sl.notes
  FROM sprint_log sl
  WHERE (   sl.knee_before    IS NOT NULL
         OR sl.knee_during    IS NOT NULL
         OR sl.knee_after     IS NOT NULL
         OR sl.knee_day_after IS NOT NULL)
    AND NOT EXISTS (
      SELECT 1 FROM injury_pain ip2
      WHERE ip2.source    = 'legacy_sprint'
        AND ip2.injury_id = v_injury_id
        AND ip2.date      = sl.date
    );
END $$;

-- ─── 4. Verifikasjon ─────────────────────────────────────────────────────────
-- Kjør denne SELECTen etter migrasjonen. Par 1 og par 2 MÅ gi like tall.
-- Ulikhet betyr duplikate datoer i kildetabellen — stopp og undersøk.
--
-- STOPP-KRITERIUM: knee_pain_rows != injury_pain_legacy_knee
--                  sprint_log_knee_rows != injury_pain_legacy_sprint
SELECT
  (SELECT COUNT(*) FROM knee_pain)
    AS knee_pain_rows,
  (SELECT COUNT(*) FROM injury_pain WHERE source = 'legacy_knee_pain')
    AS injury_pain_legacy_knee,
  (SELECT COUNT(*) FROM sprint_log
   WHERE knee_before    IS NOT NULL
      OR knee_during    IS NOT NULL
      OR knee_after     IS NOT NULL
      OR knee_day_after IS NOT NULL)
    AS sprint_log_knee_rows,
  (SELECT COUNT(*) FROM injury_pain WHERE source = 'legacy_sprint')
    AS injury_pain_legacy_sprint;
