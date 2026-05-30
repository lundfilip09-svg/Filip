ALTER TABLE todos ADD COLUMN IF NOT EXISTS sort_order integer;
UPDATE todos SET sort_order = 0 WHERE sort_order IS NULL;
