// All per-tenant secrets live in one dedicated table, `tenant_secrets`,
// deliberately kept OUT of `tenants.config` (that JSONB is returned
// wholesale to the dashboard client on every session load, and is what the
// git-committed tenants/<slug>/config.json seed file becomes — neither
// place is safe for a real credential). Two independent concerns share this
// table today:
//
//   - AI-assist API key/provider/model (see KNOWLEDGE_GRAPH.md's
//     ai-assist-toggle node) — generic across AI providers, not
//     Anthropic-specific.
//   - WhatsApp + email sending credentials — every tenant has their own
//     WhatsApp Business number and (optionally) their own email sender, so
//     these can no longer be single platform-wide env vars the way they
//     started; a tenant's own saved value always overrides the platform env
//     var of the same name, never the other way round.
//
// No route ever returns a raw secret column — only masked booleans
// (hasApiKey, hasAccessToken, hasResendKey, etc).

import { query, queryOne } from "./client.js";

// ---------- AI-assist API key ----------

export async function getTenantAiProviderInfo(
  tenantId: string
): Promise<{ hasApiKey: boolean; provider: string; model?: string }> {
  const row = await queryOne<{ provider: string; api_key: string | null; model: string | null }>(
    `SELECT provider, api_key, model FROM tenant_secrets WHERE tenant_id = $1`,
    [tenantId]
  );
  return {
    hasApiKey: Boolean(row?.api_key),
    provider: row?.provider ?? "anthropic",
    ...(row?.model ? { model: row.model } : {}),
  };
}

/** Internal use only — never return this from a route handler. */
export async function getTenantApiKey(tenantId: string): Promise<{ apiKey: string | null; provider: string; model?: string }> {
  const row = await queryOne<{ provider: string; api_key: string | null; model: string | null }>(
    `SELECT provider, api_key, model FROM tenant_secrets WHERE tenant_id = $1`,
    [tenantId]
  );
  return {
    apiKey: row?.api_key ?? null,
    provider: row?.provider ?? "anthropic",
    ...(row?.model ? { model: row.model } : {}),
  };
}

export async function setTenantApiKey(
  tenantId: string,
  patch: { apiKey?: string | null; provider?: string; model?: string | null }
): Promise<void> {
  await query(
    `INSERT INTO tenant_secrets (tenant_id, provider, api_key, model, updated_at)
     VALUES ($1, coalesce($2, 'anthropic'), $3, $4, now())
     ON CONFLICT (tenant_id) DO UPDATE SET
       provider = coalesce($2, tenant_secrets.provider),
       api_key = CASE WHEN $5::boolean THEN $3 ELSE tenant_secrets.api_key END,
       model = CASE WHEN $6::boolean THEN $4 ELSE tenant_secrets.model END,
       updated_at = now()`,
    [
      tenantId,
      patch.provider ?? null,
      patch.apiKey ?? null,
      patch.model ?? null,
      "apiKey" in patch,
      "model" in patch,
    ]
  );
}

// ---------- WhatsApp + email channel credentials ----------

export interface ChannelCredentialsInfo {
  whatsappMode: "stub" | "live";
  hasWhatsappAccessToken: boolean;
  whatsappPhoneNumberId: string | null;
  hasWhatsappWebhookVerifyToken: boolean;
  emailMode: "stub" | "resend";
  hasResendApiKey: boolean;
}

/** Non-secret view — safe to return to the dashboard client. */
export async function getTenantChannelInfo(tenantId: string): Promise<ChannelCredentialsInfo> {
  const row = await queryOne<any>(
    `SELECT whatsapp_mode, whatsapp_phone_number_id, whatsapp_access_token,
            whatsapp_webhook_verify_token, email_mode, resend_api_key
     FROM tenant_secrets WHERE tenant_id = $1`,
    [tenantId]
  );
  return {
    whatsappMode: row?.whatsapp_mode === "live" ? "live" : "stub",
    hasWhatsappAccessToken: Boolean(row?.whatsapp_access_token),
    whatsappPhoneNumberId: row?.whatsapp_phone_number_id ?? null,
    hasWhatsappWebhookVerifyToken: Boolean(row?.whatsapp_webhook_verify_token),
    emailMode: row?.email_mode === "resend" ? "resend" : "stub",
    hasResendApiKey: Boolean(row?.resend_api_key),
  };
}

export interface ResolvedChannelSecrets {
  whatsappMode: "stub" | "live";
  whatsappPhoneNumberId: string | undefined;
  whatsappAccessToken: string | undefined;
  whatsappWebhookVerifyToken: string;
  emailMode: "stub" | "resend";
  resendApiKey: string | undefined;
}

/**
 * The values @hpas/channels actually sends with — a tenant's own saved
 * column wins; a NULL column falls back to the platform-wide env var of the
 * same name, so an environment with no per-tenant credentials configured
 * yet behaves exactly as it did before this table existed.
 */
export async function getTenantChannelSecrets(tenantId: string): Promise<ResolvedChannelSecrets> {
  const row = await queryOne<any>(
    `SELECT whatsapp_mode, whatsapp_phone_number_id, whatsapp_access_token,
            whatsapp_webhook_verify_token, email_mode, resend_api_key
     FROM tenant_secrets WHERE tenant_id = $1`,
    [tenantId]
  );
  return {
    whatsappMode: (row?.whatsapp_mode ?? (process.env.WHATSAPP_MODE === "live" ? "live" : "stub")) as "stub" | "live",
    whatsappPhoneNumberId: row?.whatsapp_phone_number_id ?? process.env.WHATSAPP_PHONE_NUMBER_ID,
    whatsappAccessToken: row?.whatsapp_access_token ?? process.env.WHATSAPP_ACCESS_TOKEN,
    whatsappWebhookVerifyToken:
      row?.whatsapp_webhook_verify_token ?? process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "dev-verify-token",
    emailMode: (row?.email_mode ?? (process.env.EMAIL_MODE === "resend" ? "resend" : "stub")) as "stub" | "resend",
    resendApiKey: row?.resend_api_key ?? process.env.RESEND_API_KEY,
  };
}

export async function setTenantChannelSecrets(
  tenantId: string,
  patch: {
    whatsappMode?: "stub" | "live" | null;
    whatsappPhoneNumberId?: string | null;
    whatsappAccessToken?: string | null;
    whatsappWebhookVerifyToken?: string | null;
    emailMode?: "stub" | "resend" | null;
    resendApiKey?: string | null;
  }
): Promise<void> {
  await query(
    `INSERT INTO tenant_secrets (tenant_id, whatsapp_mode, whatsapp_phone_number_id, whatsapp_access_token, whatsapp_webhook_verify_token, email_mode, resend_api_key, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (tenant_id) DO UPDATE SET
       whatsapp_mode = CASE WHEN $8::boolean THEN $2 ELSE tenant_secrets.whatsapp_mode END,
       whatsapp_phone_number_id = CASE WHEN $9::boolean THEN $3 ELSE tenant_secrets.whatsapp_phone_number_id END,
       whatsapp_access_token = CASE WHEN $10::boolean THEN $4 ELSE tenant_secrets.whatsapp_access_token END,
       whatsapp_webhook_verify_token = CASE WHEN $11::boolean THEN $5 ELSE tenant_secrets.whatsapp_webhook_verify_token END,
       email_mode = CASE WHEN $12::boolean THEN $6 ELSE tenant_secrets.email_mode END,
       resend_api_key = CASE WHEN $13::boolean THEN $7 ELSE tenant_secrets.resend_api_key END,
       updated_at = now()`,
    [
      tenantId,
      patch.whatsappMode ?? null,
      patch.whatsappPhoneNumberId ?? null,
      patch.whatsappAccessToken ?? null,
      patch.whatsappWebhookVerifyToken ?? null,
      patch.emailMode ?? null,
      patch.resendApiKey ?? null,
      "whatsappMode" in patch,
      "whatsappPhoneNumberId" in patch,
      "whatsappAccessToken" in patch,
      "whatsappWebhookVerifyToken" in patch,
      "emailMode" in patch,
      "resendApiKey" in patch,
    ]
  );
}
