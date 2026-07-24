-- Inventory: stock tracking layered onto the existing menu_items catalog
-- (no separate item table — Menu, Pricing, and Inventory all share one
-- catalog). Sales velocity is read from the existing append-only events
-- table the same way ai-pricing already does (matched by item name in JS,
-- see tenantItemSalesByName in repos-pricing.ts) — see
-- packages/core/src/inventory.ts for the deterministic reorder engine.
-- An optional, admin-gated add-on (tenant.config.modules.inventory), same
-- gating shape as ai-pricing. See KNOWLEDGE_GRAPH.md.

ALTER TABLE menu_items
  ADD COLUMN current_qty       NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN unit              TEXT NOT NULL DEFAULT 'unit',
  ADD COLUMN reorder_point     NUMERIC(12,2),
  ADD COLUMN lead_time_days    INTEGER,
  ADD COLUMN track_stock       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN last_restocked_at TIMESTAMPTZ;

-- Append-only stock movement log, mirrors loyalty_ledger's shape/intent:
-- every change to current_qty (sale-driven decrement, manual override,
-- restock) is recorded here first; current_qty is just the running total.
CREATE TABLE stock_ledger (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  delta        NUMERIC(12,2) NOT NULL,
  source       TEXT NOT NULL CHECK (source IN ('sale', 'manual', 'restock')),
  reason       TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_ledger_tenant_item ON stock_ledger (tenant_id, menu_item_id, created_at DESC);

-- Reorder suggestion cache — one row per item, upserted by the
-- predict-inventory job, mirrors price_recommendations exactly.
CREATE TABLE reorder_suggestions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  menu_item_id          UUID NOT NULL REFERENCES menu_items(id),
  current_qty           NUMERIC(12,2) NOT NULL,
  avg_daily_sales       NUMERIC(12,4) NOT NULL,
  days_of_stock_left    NUMERIC(8,2),
  suggested_order_qty   NUMERIC(12,2) NOT NULL,
  suggested_order_date  DATE NOT NULL,
  urgency               TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
  rationale             TEXT,
  manual_override_qty   NUMERIC(12,2),
  computed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, menu_item_id)
);
CREATE INDEX idx_reorder_suggestions_tenant ON reorder_suggestions (tenant_id);

-- Per-tenant AI API key for the AI-assist toggle (see KNOWLEDGE_GRAPH.md's
-- ai-assist-toggle node) — deliberately NOT part of tenants.config, which is
-- returned wholesale to the dashboard client on every session load and is
-- what the git-committed tenants/<slug>/config.json seed file becomes. API
-- routes only ever expose a masked hasApiKey boolean, never this raw column.
-- `provider` names which model backend the key is for (e.g. "anthropic",
-- "openai", "google") — kept generic/free-text so adding a new provider is
-- an @hpas/ai change, never a schema migration.
CREATE TABLE tenant_secrets (
  tenant_id  UUID PRIMARY KEY REFERENCES tenants(id),
  provider   TEXT NOT NULL DEFAULT 'anthropic',
  api_key    TEXT,
  model      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
