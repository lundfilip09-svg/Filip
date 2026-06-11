-- Rett kne-notatet (injuries): «backwards treadmill» er udokumentert
-- (prøvd én gang, ingen egen logg på effekt) og «eksentrisk leg extension»
-- skal være «leg extension». Kjøres i Supabase SQL editor.
update injuries
set note = replace(
             replace(note, 'eksentrisk leg extension', 'leg extension'),
             ', backwards treadmill', ''
           )
where body_part = 'body.knee'
  and side = 'left'
  and note like '%backwards treadmill%';

-- Verifiser:
select body_part, side, note from injuries where body_part = 'body.knee';
