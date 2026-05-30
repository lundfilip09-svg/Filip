-- Fjern auto-utfylte notater som ble seedet inn i training_plan.notes
-- Disse var ment som øktbeskrivelser, ikke som brukernotater
UPDATE training_plan
SET notes = NULL
WHERE notes IN (
  'Tung styrke — knebøy, hoftehengsle, trekk/press',
  '100m/200m intervaller, flygende 60m, eller tempoløp',
  'Mobilitet, skulder, hofte, rygg + lett kondisjon',
  'Akselerasjon, 60m blokk, teknikk',
  'Eksplosiv styrke — RDL, benkpress, rows, chin-ups',
  'Lengre distanse, 150m/200m, eller aktiv hvile'
);
