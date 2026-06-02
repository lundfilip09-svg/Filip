-- 023_physio_notes.sql
-- Notater fra fysioterapeut-/naprapat-timer. Filip fører inn per time, og
-- AI-Overseer henter de nyeste inn i konteksten (erstatter hardkodet Havre-info).

CREATE TABLE IF NOT EXISTS physio_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date NOT NULL,
  therapist   text,
  note        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS physio_notes_date_idx ON physio_notes (date DESC);
