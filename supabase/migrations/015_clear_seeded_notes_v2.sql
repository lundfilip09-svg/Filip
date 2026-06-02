-- 015: Fjern auto-seedede standardnotater i training_plan.notes
-- Migration 012 traff ikke radene fordi de bruker em-dash (—), ikke en-dash (–).
-- Denne matcher uavhengig av bindestrek-type, og rører IKKE notater Filip har skrevet selv.
-- Kjør i Supabase SQL Editor.

UPDATE training_plan
SET notes = ''
WHERE regexp_replace(notes, '[–—-]', '-', 'g') IN (
  'Tung styrke - knebøy, hoftehengsle, trekk/press',
  '100m/200m intervaller, flygende 60m, eller tempoløp',
  'Mobilitet, skulder, hofte, rygg + lett kondisjon',
  'Akselerasjon, 60m blokk, teknikk',
  'Eksplosiv styrke - RDL, benkpress, rows, chin-ups',
  'Lengre distanse, 150m/200m, eller aktiv hvile'
);

-- Gjør det samme for uke-spesifikk tabell (training_plan_weekly), i tilfelle de er kopiert dit.
UPDATE training_plan_weekly
SET notes = ''
WHERE regexp_replace(notes, '[–—-]', '-', 'g') IN (
  'Tung styrke - knebøy, hoftehengsle, trekk/press',
  '100m/200m intervaller, flygende 60m, eller tempoløp',
  'Mobilitet, skulder, hofte, rygg + lett kondisjon',
  'Akselerasjon, 60m blokk, teknikk',
  'Eksplosiv styrke - RDL, benkpress, rows, chin-ups',
  'Lengre distanse, 150m/200m, eller aktiv hvile'
);
