-- 047_cleanup_orphan_pain_per_source.sql
-- Erstatter den for forsiktige 046: smerte ryddes PER KILDE/ØKTTYPE, ikke "ingen økt
-- på datoen". En sprint-smerte er foreldreløs hvis det ikke finnes en sprint-økt på
-- datoen – selv om en gym-/activity-økt deler dato (de har sine egne smerterader).
-- Manuelt loggede smerter (source='manual') røres ikke.

-- injury_pain – sprint-origin. Matcher BÅDE source='sprint' OG session_type 'Sprint%'
-- (sistnevnte fanger også migrerte rader med source='legacy_knee_pain').
DELETE FROM injury_pain ip
WHERE (ip.source = 'sprint' OR ip.session_type ILIKE 'Sprint%')
  AND NOT EXISTS (SELECT 1 FROM sprint_log s WHERE s.date = ip.date);

-- injury_pain – gym-origin
DELETE FROM injury_pain ip
WHERE ip.source = 'gym'
  AND NOT EXISTS (SELECT 1 FROM gym_log g WHERE g.date = ip.date);

-- injury_pain – activity-origin
DELETE FROM injury_pain ip
WHERE ip.source = 'activity'
  AND NOT EXISTS (SELECT 1 FROM activity_log a WHERE a.date = ip.date);

-- Legacy knee_pain – sprint-origin (session_type 'Sprint%') uten sprint-økt.
DELETE FROM knee_pain k
WHERE k.session_type ILIKE 'Sprint%'
  AND NOT EXISTS (SELECT 1 FROM sprint_log s WHERE s.date = k.date);
