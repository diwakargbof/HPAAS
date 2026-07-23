-- AI Pricing: an optional, admin-gated add-on (tenant.config.modules.pricing)
-- that recommends per-item price changes from the tenant's own sales history.
-- Deliberately a bounded, explainable demand-trend heuristic (rising/falling
-- 90-day sales vs the prior 90 days), not an econometric elasticity model —
-- small-shop transaction volume can't support one. See KNOWLEDGE_GRAPH.md.
--
-- One row per item, upserted whenever the tenant hits "Refresh
-- recommendations" (never a background cron — each refresh costs one AI
-- call and prices shouldn't drift on their own).

CREATE TABLE price_recommendations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  menu_item_id     UUID NOT NULL REFERENCES menu_items(id),
  current_price    NUMERIC(12,2) NOT NULL,
  suggested_price  NUMERIC(12,2) NOT NULL,
  change_percent   NUMERIC(6,2) NOT NULL,
  demand_trend     TEXT NOT NULL CHECK (demand_trend IN ('rising', 'falling', 'flat')),
  confidence       TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  rationale        TEXT,
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, menu_item_id)
);
CREATE INDEX idx_price_recommendations_tenant ON price_recommendations (tenant_id);
