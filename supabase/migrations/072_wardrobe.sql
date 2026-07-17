-- 072_wardrobe.sql — Garderobe: plagg, antrekk + privat storage-bucket
--
-- Datamodell (bevisste valg):
--  • garments    = enkeltplagg. Sesong er IKKE en egenskap ved plagget —
--                  en hvit t-skjorte lever i både sommer- og vinterantrekk.
--  • outfits     = antrekk. Sesong/anledning ligger HER (text[]-tags).
--  • outfit_items = kobling antrekk↔plagg (samme plagg i mange antrekk).
--                  on delete cascade begge veier → sletting rydder selv.
--  • Bildene ligger i privat bucket 'wardrobe' (signerte URL-er fra klienten).
--
-- RLS etter 052-mønsteret på alle tre tabellene + policy på storage.objects.

create table if not exists public.garments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null check (category in ('top','bottom','outerwear','shoes','accessory')),
  color       text,
  brand       text,
  size        text,
  price       numeric,               -- valgfri; muliggjør pris-per-bruk senere
  image_path  text,                  -- sti i bucket 'wardrobe' (null = uten bilde)
  notes       text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.outfits (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  seasons     text[] not null default '{}',   -- 'summer' | 'autumn_spring' | 'winter'
  occasions   text[] not null default '{}',   -- 'everyday'|'school'|'church'|'training'|'party'|'dressy'
  notes       text,
  favorite    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.outfit_items (
  id          uuid primary key default gen_random_uuid(),
  outfit_id   uuid not null references public.outfits(id)  on delete cascade,
  garment_id  uuid not null references public.garments(id) on delete cascade,
  position    int not null default 0,
  unique (outfit_id, garment_id)
);

create index if not exists outfit_items_outfit_idx  on public.outfit_items (outfit_id);
create index if not exists outfit_items_garment_idx on public.outfit_items (garment_id);

-- ── RLS (052-mønsteret): kun authenticated, anon revokes ────────────────────
DO $$
DECLARE
  t text;
  tbls text[] := array['garments','outfits','outfit_items'];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_full_access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "authenticated_full_access" ON public.%I '
      'FOR ALL USING (auth.role() = ''authenticated'') '
      'WITH CHECK (auth.role() = ''authenticated'')', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- ── Storage: privat bucket 'wardrobe' ───────────────────────────────────────
-- Privat (public=false) → bilder hentes med signerte URL-er av innlogget
-- klient. 5 MB per fil holder lenge (webp/png ~0.1–0.8 MB etter komprimering).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wardrobe', 'wardrobe', false, 5242880,
        array['image/webp','image/png','image/jpeg'])
on conflict (id) do nothing;

-- storage.objects har allerede RLS på fra Supabase — vi trenger bare policyen.
drop policy if exists "wardrobe_authenticated_all" on storage.objects;
create policy "wardrobe_authenticated_all" on storage.objects
  for all using (bucket_id = 'wardrobe' and auth.role() = 'authenticated')
  with check (bucket_id = 'wardrobe' and auth.role() = 'authenticated');
