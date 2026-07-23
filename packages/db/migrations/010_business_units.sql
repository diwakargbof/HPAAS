-- Business units (branches/regions) — a tag/filter dimension, not real
-- sub-tenants. The named list itself lives in tenants.config JSONB
-- (businessUnits.units); these columns just let menu items and invoices
-- carry the tag.
ALTER TABLE menu_items ADD COLUMN business_unit_ids JSONB NOT NULL DEFAULT '[]';
ALTER TABLE invoices ADD COLUMN business_unit_id TEXT;
