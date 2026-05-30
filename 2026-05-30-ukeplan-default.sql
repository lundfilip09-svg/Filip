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
  (0, 'Styrke Kapasitet', 'Tung styrke — knebøy, hoftehengsle, trekk/press'),
  (1, 'Sprint',           '100m/200m intervaller, flygende 60m, eller tempoløp'),
  (2, 'Mobilitet og kondisjon', 'Mobilitet, skulder, hofte, rygg + lett kondisjon'),
  (3, 'Sprint',           'Akselerasjon, 60m blokk, teknikk'),
  (4, 'Styrke Power',     'Eksplosiv styrke — RDL, benkpress, rows, chin-ups'),
  (5, 'Fri',              ''),
  (6, 'Sprint',           'Lengre distanse, 150m/200m, eller aktiv hvile')
) AS v(day_index, session_text, notes)
ON CONFLICT (user_id, day_index) DO UPDATE
  SET session_text = EXCLUDED.session_text,
      notes        = EXCLUDED.notes;
