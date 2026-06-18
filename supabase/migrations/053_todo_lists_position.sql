-- Additive, idempotent: create todo_lists table with position column
-- Backfills from distinct list_name values in todos

CREATE TABLE IF NOT EXISTS public.todo_lists (
  id       uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  name     text    NOT NULL UNIQUE,
  position integer NOT NULL DEFAULT 0
);

-- ── RLS (same pattern as all other tables) ───────────────────────────────────
ALTER TABLE public.todo_lists ENABLE  ROW LEVEL SECURITY;
ALTER TABLE public.todo_lists FORCE   ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.todo_lists;
CREATE POLICY "authenticated_full_access" ON public.todo_lists
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
REVOKE ALL ON public.todo_lists FROM anon;

-- ── Backfill: insert distinct list_names ordered by first created todo ───────
-- ON CONFLICT DO NOTHING = idempotent (safe to re-run)
INSERT INTO public.todo_lists (name, position)
SELECT
  list_name,
  (ROW_NUMBER() OVER (ORDER BY MIN(created_at)) - 1)::integer AS position
FROM public.todos
GROUP BY list_name
ON CONFLICT (name) DO NOTHING;
