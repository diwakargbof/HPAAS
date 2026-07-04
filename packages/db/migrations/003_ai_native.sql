-- AI-native expansion: menu catalog, loyalty ledger, 1:1 direct messages,
-- counter-recommendation cache, and segment provenance metadata.

-- The shop's menu/catalog. Feeds counter recommendations and campaign copy.
CREATE TABLE menu_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'uncategorized',
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  tags        JSONB NOT NULL DEFAULT '[]',
  available   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX idx_menu_items_tenant ON menu_items (tenant_id);

-- Append-only loyalty points ledger; balance = sum(points) per profile.
CREATE TABLE loyalty_ledger (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  points     INTEGER NOT NULL,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_loyalty_tenant_profile ON loyalty_ledger (tenant_id, profile_id, created_at DESC);

-- 1:1 messages sent by the owner from the Counter page. Deliberately NOT in
-- the campaign messages table: personal notes must never pollute campaign
-- attribution or hold-out accounting.
CREATE TABLE direct_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  channel    TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp','email','call')),
  body       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed')),
  sent_by    TEXT NOT NULL DEFAULT '',
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_direct_messages_tenant_profile ON direct_messages (tenant_id, profile_id, sent_at DESC);

-- Cache for counter cards (recommendations + AI pitch). One AI call per
-- customer per day at most, and only for customers who actually show up.
CREATE TABLE counter_cards (
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  profile_id  UUID NOT NULL REFERENCES profiles(id),
  payload     JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, profile_id)
);

-- Segment provenance: standard (seeded), custom (owner-typed via AI
-- translation), ai_suggested (AI-discovered). Plus a plain-English
-- description shown in the dashboard.
ALTER TABLE segments ADD COLUMN description TEXT;
ALTER TABLE segments ADD COLUMN source TEXT NOT NULL DEFAULT 'standard'
  CHECK (source IN ('standard','custom','ai_suggested'));
