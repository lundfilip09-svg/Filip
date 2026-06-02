-- 021_ai_chat_realtime.sql
-- Live-sync av AI-chat mellom enheter (mac ↔ telefon): legg ai_chat_history
-- til i Supabase Realtime-publiseringen så klienter får INSERT-hendelser i
-- sanntid. RLS gjelder fortsatt (Realtime respekterer RLS-policyene).

ALTER PUBLICATION supabase_realtime ADD TABLE ai_chat_history;
