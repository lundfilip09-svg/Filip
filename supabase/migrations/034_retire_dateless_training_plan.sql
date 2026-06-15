-- 034_retire_dateless_training_plan.sql
-- Kjør i Supabase SQL Editor.
--
-- Bakgrunn: training_plan var et datoløst per-dag-overstyringslag (kun day_index 0–6,
-- ingen uke/dato). Det nullstilles aldri ved ukeskifte, så overstyringer fra én uke
-- (f.eks. «Hvile og rehab» tir–søn) ble liggende og «lekket» inn i neste uke.
--
-- Etter koderefaktoren leses training_plan ikke lenger noe sted:
--   - weekly_plan          = fast standarduke (eneste kilde til den faste planen)
--   - training_plan_weekly = per-dag-overstyring, dato-forankret på ukens mandag
--     (utløper automatisk når mandagen skifter)
-- treningsplan.html, dashboard.html og api/_lib/context.js peker nå alle hit.
--
-- Denne migrasjonen tømmer de gjenværende (lekkede) training_plan-radene. Den faste
-- planen er trygt bevart i weekly_plan. Tabellen beholdes (ikke droppet) for historikk.

DELETE FROM training_plan
WHERE user_id = auth.uid();
