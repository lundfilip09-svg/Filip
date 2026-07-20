-- 076_garment_subcategory_color.sql — underkategori + hex-farge på plagg
--
-- subcategory: bevisst UTEN check-constraint. Category (5 grupper) styrer
-- fortsatt gruppering/sortering/CAT_ORDER; subcategory er kun forfining.
-- En check her ville krevd migrasjon hver gang en ny plaggtype dukker opp.
-- color_hex: presis prøve fra fargepipetten. color (finnes fra 072) beholdes
-- som LESBART navn ('Marineblå') — det er navnet som er nyttig i eksport-teksten.

alter table public.garments add column if not exists subcategory text;
alter table public.garments add column if not exists color_hex   text;

-- Ingen ny tabell → ingen ny RLS-blokk. garments har RLS + policy fra 072.
-- Verifiser med spørringen i CLAUDE.md hvis du er i tvil.
