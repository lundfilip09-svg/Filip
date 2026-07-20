-- 074_songs.sql — Musikk-repertoar: lovsanger piano/gitar
--
-- Ren repertoar-liste. Ingen statusknapp, ingen øvingslogg.
-- RLS etter 052-mønsteret.

create table if not exists public.songs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  title       text not null,
  artist      text,
  instruments text[] not null default '{}',   -- 'piano' | 'gitar'
  technique   text,                            -- 'akkord' | 'fingerspill'
  song_key    text,
  capo        int,
  video_url   text,
  chords_url  text,
  notes       text,
  created_at  timestamptz not null default now()
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.songs;
CREATE POLICY "authenticated_full_access" ON public.songs
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
REVOKE ALL ON public.songs FROM anon;
