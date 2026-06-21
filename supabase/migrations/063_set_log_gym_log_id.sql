-- 063_set_log_gym_log_id.sql
-- Kobler set_log-rader til gym_log for pålitelig historikk-query.
-- Nullable for bakoverkompatibilitet med eksisterende rader.

ALTER TABLE public.set_log
  ADD COLUMN IF NOT EXISTS gym_log_id uuid REFERENCES public.gym_log(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS set_log_gym_log_id_idx ON public.set_log (gym_log_id);
