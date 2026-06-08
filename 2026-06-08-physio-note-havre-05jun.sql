-- 2026-06-08-physio-note-havre-05jun.sql
-- Engangs-insert: fysio-notat fra Andreas Havre, fredag 5. juni 2026.
-- Kjør i Supabase SQL Editor (kjører som postgres → forbi RLS).
-- user_id hentes fra innlogget bruker via e-post (enkeltbrukersystem).

INSERT INTO physio_notes (date, therapist, note, user_id)
VALUES (
  '2026-06-05',
  'Andreas Havre',
  'Rammer: Du er fortsatt trainee — ikke noe som heter å feile, bare å lære. Du har 2 år før vi fokuserer på tider og prestasjon; nå handler det om deg selv og hvordan du trener best mulig. Du stiller mange gode spørsmål. Havre tror Erlend egentlig tester deg — vil se hvor mye du vil ha det og hva som virkelig betyr noe for deg.
Belastning: Tren isokinetisk → eksentrisk → konsentrisk. Lurt å droppe Framo-lekene, men stå på innimellom. Trening dagen før kamp/stevne er bra så lenge du ikke blir utmattet (Havre + Erlend) — for hard trening gir utmattelse og du mister kvikkheten du trenger. Tren ikke for melkesyre: ved 3x15 (45 reps) skal de første 3 gå like bra som de siste 3, ellers trener du for hardt. Ligg på 60-80 %, aldri til failure.
Øvelser: Knebøy (1) → step up (3) → annet (2), rangert etter minst belastning på kne/hamstring. Split squat jumps. RDL. Nordic hamstring. Ball bak rygg mot hjørnevegg, 1-fots squat (brems med quad, skyv med glutes/hofte). Sittende tåhev: tung vekt for akilles + lavere vekt 1-fot for soleus. Eksentrisk tåhev forsiktig — ikke for tungt på akilles.
Videre: Fri i helgen, evt. kontrollert RDL søndag. Får jeg hamstringskade om 1-2 uker, tilbake til Havre. Havre kommer kanskje innom en søndagsøkt.',
  (SELECT id FROM auth.users WHERE email = 'filip.lund09@gmail.com' LIMIT 1)
);
