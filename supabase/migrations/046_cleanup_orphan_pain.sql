-- 046_cleanup_orphan_pain.sql
-- Engangsopprydding: fjern foreldreløse smerterader i injury_pain som ble
-- liggende igjen fra økter som er slettet FØR slett-fiksen (sprint/gym/treningsplan).
-- En rad er foreldreløs hvis den stammer fra en økt (source != 'manual') og det
-- ikke lenger finnes NOEN økt på den datoen i sprint_log/gym_log/activity_log.
-- Manuelt loggede smerter (source='manual') røres ALDRI – de kan stå på dager uten økt.
DELETE FROM injury_pain ip
WHERE ip.source <> 'manual'
  AND NOT EXISTS (SELECT 1 FROM sprint_log   s WHERE s.date = ip.date)
  AND NOT EXISTS (SELECT 1 FROM gym_log      g WHERE g.date = ip.date)
  AND NOT EXISTS (SELECT 1 FROM activity_log a WHERE a.date = ip.date);
