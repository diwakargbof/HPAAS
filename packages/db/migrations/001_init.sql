-- HPAS initial schema. Every business table carries tenant_id and every
-- index leads with it: tenant isolation is row-level and query-enforced.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  config          JSONB NOT NULL,
  whatsapp_number TEXT NOT NULL DEFAULT '',
  api_key         TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  phone      TEXT NOT NULL,               -- E.164, normalized in @hpas/core
  traits     JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, phone)
);

-- Append-only. No UPDATE/DELETE path exists in the query layer.
CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  profile_id  UUID NOT NULL REFERENCES profiles(id),
  location_id TEXT,
  event_type  TEXT NOT NULL,
  items       JSONB NOT NULL DEFAULT '[]',
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  ts          TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_events_tenant_profile_ts ON events (tenant_id, profile_id, ts DESC);
CREATE INDEX idx_events_tenant_ts ON events (tenant_id, ts DESC);

-- Precomputed by the worker; segmentation reads ONLY this table.
CREATE TABLE features (
  profile_id           UUID PRIMARY KEY REFERENCES profiles(id),
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  recency_days         INTEGER NOT NULL,
  frequency_90d        INTEGER NOT NULL,
  monetary_ltv         NUMERIC(12,2) NOT NULL,
  category_affinity    TEXT,
  festival_buyer       BOOLEAN NOT NULL DEFAULT false,
  last_festival_basket JSONB,
  reorder_cadence_days INTEGER,
  favorite_item        TEXT,
  computed_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_features_tenant ON features (tenant_id);

CREATE TABLE segments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  name          TEXT NOT NULL,
  rule          JSONB NOT NULL,
  campaign_type TEXT NOT NULL,
  UNIQUE (tenant_id, name)
);

CREATE TABLE campaigns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  segment_id     UUID NOT NULL REFERENCES segments(id),
  status         TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','pending_approval','approved','sent','rejected')),
  generated_copy JSONB,
  audience_size  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at    TIMESTAMPTZ,
  approved_by    TEXT
);
CREATE INDEX idx_campaigns_tenant_status ON campaigns (tenant_id, status);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns(id),
  profile_id      UUID NOT NULL REFERENCES profiles(id),
  channel         TEXT NOT NULL CHECK (channel IN ('whatsapp','email','call')),
  rendered_text   TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','sent','delivered','read','replied','failed')),
  is_control      BOOLEAN NOT NULL DEFAULT false,
  redemption_code TEXT UNIQUE,
  sent_at         TIMESTAMPTZ
);
CREATE INDEX idx_messages_campaign ON messages (campaign_id);
CREATE INDEX idx_messages_profile ON messages (profile_id);

CREATE TABLE preferences (
  tenant_id                 UUID NOT NULL REFERENCES tenants(id),
  campaign_type             TEXT NOT NULL,
  enabled                   BOOLEAN NOT NULL DEFAULT true,
  max_per_customer_per_week INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, campaign_type)
);

CREATE TABLE uploads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  filename       TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'processing'
                 CHECK (status IN ('processing','success','error')),
  rows_processed INTEGER NOT NULL DEFAULT 0,
  error_log      TEXT,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_uploads_tenant ON uploads (tenant_id, uploaded_at DESC);

-- Global opt-out: suppression checks this for every tenant identically.
CREATE TABLE opt_outs (
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  phone      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, phone)
);

-- WhatsApp marketing messages require recorded opt-in (Meta policy).
CREATE TABLE whatsapp_opt_ins (
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  phone      TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'import',
  opted_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, phone)
);

-- Meta requires pre-approved templates for marketing sends; model that
-- constraint explicitly instead of assuming free-form text is sendable.
CREATE TABLE whatsapp_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  body        TEXT NOT NULL,          -- with {{1}}, {{2}} numbered params
  variables   JSONB NOT NULL DEFAULT '[]',
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','submitted','approved','rejected')),
  campaign_type TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
