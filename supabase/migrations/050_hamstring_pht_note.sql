-- 050_hamstring_pht_note.sql
-- Oppdaterer NOTATET på høyre hamstring-skade med oppdatert diagnose-info (PHT)
-- slik at AI Overseer / helserapporten i ai.html får bra kontekst.
-- Rører KUN body.hamstring + side='right'. Kneskaden endres ikke.
-- Idempotent: setter notatet til ønsket fulltekst (trygt å kjøre flere ganger).
-- Kjør i Supabase SQL Editor.

UPDATE injuries
SET note = 'Proksimal hamstring-tendinopati (PHT), høyre side — overbelastning og irritasjon i senefestet helt øverst i hamstringen, der den fester til sitteknuten (tuber ischiadicum). Smerte trigges typisk av toppfartssprint, passiv tøyning av hamstringen, og direkte trykk ved sitting på (harde) stoler. Behandles nå med isometriske øvelser (statiske hold) for smertelindring og senebelastning/oppbygning. Vurdert av Havre 05.06: plagen sitter proksimalt i festet, estimert ca. 2 uker. Rehab-progresjon: isometrisk → eksentrisk → konsentrisk. Trykkbølgebehandling utført.',
    updated_at = now()
WHERE body_part = 'body.hamstring'
  AND side = 'right';

-- Verifiser:
SELECT body_part, side, status, severity, note FROM injuries WHERE body_part = 'body.hamstring' AND side = 'right';
