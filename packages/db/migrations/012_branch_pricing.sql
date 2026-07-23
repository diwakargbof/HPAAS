-- Per-branch price overrides: a menu item still has one base price, but a
-- business unit can override it. '' business_unit_id on
-- price_recommendations means "all branches" (not NULL — Postgres UNIQUE
-- treats NULLs as distinct from each other, which would break the upsert's
-- ON CONFLICT matching).
CREATE TABLE menu_item_branch_prices (
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  menu_item_id     UUID NOT NULL REFERENCES menu_items(id),
  business_unit_id TEXT NOT NULL,
  price            NUMERIC(12,2) NOT NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, menu_item_id, business_unit_id)
);

ALTER TABLE price_recommendations ADD COLUMN business_unit_id TEXT NOT NULL DEFAULT '';
ALTER TABLE price_recommendations DROP CONSTRAINT price_recommendations_tenant_id_menu_item_id_key;
ALTER TABLE price_recommendations ADD CONSTRAINT price_recommendations_tenant_item_bu_key
  UNIQUE (tenant_id, menu_item_id, business_unit_id);
