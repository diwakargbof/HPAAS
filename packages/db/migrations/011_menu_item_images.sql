-- Menu item photos, stored as a data URI — small shop catalogs (a few
-- dozen items), no external object storage needed.
ALTER TABLE menu_items ADD COLUMN image_url TEXT;
