-- Setter standard ukeplan for Filip
-- Kjør i Supabase SQL Editor
-- day_index: 0=Mandag, 1=Tirsdag, 2=Onsdag, 3=Torsdag, 4=Fredag, 5=Lørdag, 6=Søndag

INSERT INTO training_plan (user_id, day_index, session_text, notes)
SELECT
  auth.uid(),
  day_index,
  session_text,
  notes
FROM (VALUES
  (0, 'Styrke Kapasitet',        NULL),
  (1, 'Sprint',                  NULL),
  (2, 'Mobilitet og kondisjon',  NULL),
  (3, 'Sprint',                  NULL),
  (4, 'Styrke Power',            NULL),
  (5, 'Fri',                     NULL),
  (6, 'Sprint',                  NULL)
) AS v(day_index, session_text, notes)
ON CONFLICT (user_id, day_index) DO UPDATE
  SET session_text = EXCLUDED.session_text;
