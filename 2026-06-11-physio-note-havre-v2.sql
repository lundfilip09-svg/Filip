-- 2026-06-11-physio-note-havre-v2.sql
-- Omskrevet fysio-notat fra Andreas Havre (time 05.06.2026) — v2 med egen
-- HAMSTRING-seksjon slik at AI Overseer finner vurderingen.
-- Idempotent: sletter evt. gammel versjon først. Kjør i Supabase SQL Editor.

DELETE FROM physio_notes
WHERE date = '2026-06-05' AND therapist = 'Andreas Havre';

INSERT INTO physio_notes (date, therapist, note, user_id)
VALUES (
  '2026-06-05',
  'Andreas Havre',
  'HAMSTRING (høyre, debut 31.05–01.06): Vurdert av Havre. Plagen sitter øverst i hamstringen, i festet (proksimalt — Havre brukte et fagnavn jeg ikke fikk notert). Estimert varighet ca. 2 uker. Rehab-progresjon i tre nivåer etter hva som provoserer minst til mest: isometrisk → eksentrisk → konsentrisk. Trykkbølgebehandling utført i timen — klarte Nordic hamstring etter behandlingen, ikke før. Plan: fri i helgen, evt. kontrollert RDL søndag. Hvis fortsatt plager om 1–2 uker: tilbake til Havre.
KNE: Øvelseshierarki rangert etter belastning på kne/hamstring: knebøy = nivå 1 (minst), mellomting = nivå 2, step up = nivå 3 (mest).
BELASTNINGSPRINSIPPER: Ligg på 60–80 %, aldri til failure. Ikke tren for melkesyre — ved 3x15 (45 reps) skal de 3 første repsene gå like bra som de 3 siste, ellers er det for hardt. Sikt mot 10–15 reps, ikke 6–8. Trening dagen før kamp/stevne er bra så lenge du ikke blir utmattet (Havre + Erlend enige) — utmattelse koster kvikkheten du trenger dagen etter. Dropp stort sett Framo-lekene, men stå på innimellom.
ØVELSER: Split squat jumps. RDL. Nordic hamstring. Ball bak rygg mot hjørnevegg, 1-fots squat (brems med quad, skyv med glutes/hofte). Sittende tåhev — tung vekt for akilles, lavere vekt 1-fot for soleus. Eksentrisk tåhev — forsiktig, ikke for tungt på akilles.
RAMMER: Fortsatt trainee — ikke noe som heter å feile, bare å lære. 2 år før fokus på tider og prestasjon; nå handler det om å lære å trene best mulig. Stiller mange gode spørsmål. Havre tror Erlend egentlig tester deg — vil se hvor mye du vil ha det og hva som betyr noe for deg.
VIDERE: Fri i helgen, evt. kontrollert RDL søndag. Havre kommer kanskje innom en søndagsøkt. Fokus de neste 2 ukene.',
  -- user_id fra eksisterende data (auth.users-oppslag på e-post ga null)
  (SELECT user_id FROM injuries WHERE user_id IS NOT NULL LIMIT 1)
);

-- Oppdater også hamstring-skaden med Havre-vurderingen (vises i diagnose-
-- knappen og treningsdagboka). Legges til på slutten av eksisterende notat.
UPDATE injuries
SET note = note || ' Vurdert av Havre 05.06: plagen sitter proksimalt i festet, estimert ca. 2 uker. Rehab-progresjon: isometrisk → eksentrisk → konsentrisk. Trykkbølgebehandling utført.'
WHERE body_part = 'body.hamstring'
  AND side = 'right'
  AND note NOT LIKE '%Vurdert av Havre%';

-- Verifiser:
SELECT date, therapist, left(note, 120) FROM physio_notes ORDER BY date DESC LIMIT 3;
SELECT body_part, side, note FROM injuries WHERE body_part = 'body.hamstring';
