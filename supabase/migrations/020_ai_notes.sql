-- 020_ai_notes.sql
-- B6: AI-Overseer kan skrive korte notater til seg selv ("foreslo deload uke 23"),
-- slik at den husker egne råd over tid. Notatene legges inn i konteksten ved
-- senere meldinger. Server skriver hit; klienten trenger ikke røre tabellen.
-- NB: enbruker-app (som workout_program), ingen user_id/RLS.

CREATE TABLE IF NOT EXISTS ai_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date       date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  note       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_notes_created_idx ON ai_notes (created_at DESC);
