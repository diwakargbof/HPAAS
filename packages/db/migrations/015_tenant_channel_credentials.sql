-- Per-tenant WhatsApp/email sending credentials — each shop has its own
-- WhatsApp Business number and (optionally) its own email sender, so these
-- can no longer be single platform-wide env vars. Reuses the tenant_secrets
-- table introduced for the AI-assist API key (014_inventory.sql): same
-- reasoning applies (never part of tenants.config, which is returned
-- wholesale to the dashboard client) and same override precedence — a
-- tenant's own saved value wins; a NULL column falls back to the
-- platform-wide env var of the same name (see packages/db/src/repos-tenant-secrets.ts).

ALTER TABLE tenant_secrets
  ADD COLUMN whatsapp_mode                 TEXT,
  ADD COLUMN whatsapp_phone_number_id      TEXT,
  ADD COLUMN whatsapp_access_token         TEXT,
  ADD COLUMN whatsapp_webhook_verify_token TEXT,
  ADD COLUMN email_mode                    TEXT,
  ADD COLUMN resend_api_key                TEXT;
