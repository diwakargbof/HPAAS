// WhatsApp adapter for the Meta Cloud API.
//
// MODES
//   stub (default): no HTTP calls; sends are recorded and succeed, and
//     template "approval" is instant. The full demo runs in this mode.
//   live: real Graph API calls. TODO(whatsapp-live): requires Meta BSP
//     onboarding — fill WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN
//     in .env and set WHATSAPP_MODE=live. Template submission must go
//     through Meta's template review (hours to days) before sending.
//
// CONSTRAINT MODELED EXPLICITLY: marketing messages may only be sent via a
// PRE-APPROVED template. sendViaWhatsApp refuses to send when the tenant
// has no approved template for the campaign type — free-form text is never
// assumed sendable.

import type { CampaignType, Profile, SendMeta, SendResult, Tenant } from "@hpas/types";
import {
  addOptOut,
  addWhatsappOptIn,
  claimQrOrder,
  getApprovedTemplate,
  getCouponByCode,
  getMessageByRedemptionCode,
  getQrOrderForTenant,
  getTenantById,
  getTenantChannelSecrets,
  getWhatsappOptIns,
  insertEvent,
  redeemCoupon,
  updateMessageStatus,
  upsertProfile,
  upsertWhatsappTemplate,
  query,
} from "@hpas/db";
import {
  QR_TOKEN_REGEX,
  ingestNormalizedEvents,
  maybeIssueCoupon,
  normalizePhone,
} from "@hpas/core";
import { sendQrWelcome } from "./receipt.js";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

// Matches the name the QR claim page (apps/api/src/routes/qr-orders.ts)
// asks for and weaves into the pre-drafted message — e.g. "This is Priya,
// adding my order Q-XXXX...". Read from the message text itself rather than
// only trusting WhatsApp's account-level contact name, which many people
// never set to anything meaningful.
const NAME_FROM_MESSAGE_RE = /this is\s+([^,]{1,80}),\s*adding my order/i;

/**
 * Ensure a WhatsApp template exists for this campaign's copy.
 * stub mode: instantly "approved". live mode: recorded as "submitted" —
 * TODO(whatsapp-live): poll Meta's template status API and flip to
 * approved/rejected; sends will fail until approval lands.
 */
export async function ensureCampaignTemplate(
  tenant: Tenant,
  campaignType: CampaignType,
  templateBody: string,
  variables: string[]
): Promise<{ approved: boolean }> {
  const secrets = await getTenantChannelSecrets(tenant.id);
  const status = secrets.whatsappMode === "stub" ? "approved" : "submitted";
  await upsertWhatsappTemplate({
    tenantId: tenant.id,
    name: `${campaignType}_${hashish(templateBody)}`,
    body: templateBody,
    variables,
    status,
    campaignType,
  });
  if (secrets.whatsappMode === "live") {
    // TODO(whatsapp-live): POST /{waba_id}/message_templates to submit for review.
  }
  return { approved: status === "approved" };
}

export async function sendViaWhatsApp(
  tenant: Tenant,
  profile: Profile,
  renderedText: string,
  meta: SendMeta
): Promise<SendResult> {
  // Opt-in is mandatory for marketing messages (Meta policy).
  const optIns = await getWhatsappOptIns(tenant.id);
  if (!optIns.has(profile.phone)) {
    return { ok: false, error: "no WhatsApp opt-in recorded for this number" };
  }

  // Template constraint: no approved template, no send.
  const template = await getApprovedTemplate(tenant.id, meta.campaignType);
  if (!template) {
    return {
      ok: false,
      error: `no approved WhatsApp template for campaign type "${meta.campaignType}"`,
    };
  }

  const secrets = await getTenantChannelSecrets(tenant.id);
  if (secrets.whatsappMode === "stub") {
    return { ok: true, providerMessageId: `stub-wa-${meta.messageId}` };
  }

  // ---- live mode ----
  // TODO(whatsapp-live): map our named {{variables}} onto the approved
  // template's numbered {{1}},{{2}} params in registration order.
  const res = await fetch(
    `${GRAPH_API_BASE}/${secrets.whatsappPhoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secrets.whatsappAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: profile.phone,
        type: "template",
        template: {
          name: template.name,
          language: { code: tenant.config.brandVoice.language.replace("-", "_") },
          components: [
            {
              type: "body",
              parameters: template.variables.map(() => ({ type: "text", text: "" })),
            },
          ],
        },
        // Echoed back in status webhooks so we can correlate.
        biz_opaque_callback_data: meta.messageId,
      }),
    }
  );
  const body = (await res.json()) as { messages?: Array<{ id: string }>; error?: { message: string } };
  if (!res.ok || !body.messages?.[0]) {
    return { ok: false, error: body.error?.message ?? `graph api ${res.status}` };
  }
  return { ok: true, providerMessageId: body.messages[0].id };
}

// ---------- webhooks (delivery receipts + inbound replies) ----------

/** Meta status webhook → messages table. Correlates via biz_opaque_callback_data (our message id). */
export async function handleWhatsAppStatusWebhook(payload: any): Promise<number> {
  let updated = 0;
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const status of change?.value?.statuses ?? []) {
        const messageId = status?.biz_opaque_callback_data;
        const s = status?.status; // sent | delivered | read | failed
        if (!messageId || !["sent", "delivered", "read", "failed"].includes(s)) continue;
        await updateMessageStatus(messageId, s);
        updated++;
      }
    }
  }
  return updated;
}

/**
 * Inbound message webhook: mark replied, append a message_reply event,
 * honor STOP as opt-out, and record redemption codes typed back by
 * customers. tenantId comes from webhook routing (per-number), never
 * from the payload body.
 */
export async function handleWhatsAppInboundWebhook(
  tenantId: string,
  payload: any
): Promise<{ replies: number; optOuts: number; redemptions: number; qrClaims: number }> {
  const tenant = await getTenantById(tenantId);
  if (!tenant) return { replies: 0, optOuts: 0, redemptions: 0, qrClaims: 0 };

  let replies = 0;
  let optOuts = 0;
  let redemptions = 0;
  let qrClaims = 0;

  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const msg of change?.value?.messages ?? []) {
        // Meta's `from` is always a fully-qualified international number
        // with no leading "+" (e.g. "4917669588496" for a German number,
        // "919876543210" for Indian) — never guess a default country code
        // for it the way CSV-import numbers need, or non-Indian numbers get
        // silently rejected as invalid.
        const phone = normalizePhone(`+${String(msg?.from ?? "")}`);
        const text: string = msg?.text?.body ?? "";
        if (!phone) continue;

        // Prefer the name the customer typed on the QR claim page (baked
        // into the message text) since it's always present and always
        // accurate; fall back to WhatsApp's own account-level contact name,
        // which many people never set to anything meaningful.
        const nameFromText = text.match(NAME_FROM_MESSAGE_RE)?.[1]?.trim();
        const contact = (change?.value?.contacts ?? []).find((c: any) => c?.wa_id === msg?.from);
        const name = nameFromText || contact?.profile?.name;
        const profile = await upsertProfile(tenantId, phone, name ? { name } : {});
        await insertEvent(tenantId, profile.id, {
          eventType: "message_reply",
          items: [],
          amount: 0,
          ts: new Date(),
          locationId: undefined,
        });
        replies++;

        // Latest outbound message to this profile gets marked replied.
        await query(
          `UPDATE messages SET status = 'replied'
           WHERE id = (
             SELECT m.id FROM messages m
             JOIN campaigns c ON c.id = m.campaign_id
             WHERE c.tenant_id = $1 AND m.profile_id = $2 AND m.is_control = false
             ORDER BY m.sent_at DESC NULLS LAST LIMIT 1
           )`,
          [tenantId, profile.id]
        );

        if (/^\s*(stop|unsubscribe)\s*$/i.test(text)) {
          await addOptOut(tenantId, phone);
          optOuts++;
          continue;
        }
        // Replying counts as an explicit opt-in refresh.
        await addWhatsappOptIn(tenantId, phone, "inbound_reply");

        // A QR-order token in the pre-drafted message ("Q-7KX2M9P4QA")
        // claims that online order: the purchase lands on this phone's
        // profile (points included, via the shared ingestion path) and a
        // welcome goes back — the moment an aggregator customer becomes ours.
        const qrMatch = text.toUpperCase().match(QR_TOKEN_REGEX);
        if (qrMatch) {
          const qr = await getQrOrderForTenant(tenantId, qrMatch[0]);
          if (qr && qr.status === "pending") {
            await ingestNormalizedEvents(tenant, [
              {
                tenantId,
                phone,
                traits: {},
                locationId: undefined,
                eventType: "purchase",
                items: qr.items,
                amount: qr.amount,
                ts: new Date(qr.createdAt),
              },
            ]);
            if (await claimQrOrder(tenantId, qr.id, profile.id)) {
              const coupon = await maybeIssueCoupon(
                tenant,
                profile.id,
                phone,
                qr.amount,
                "qr_welcome"
              );
              await sendQrWelcome(tenant, profile, qr, coupon);
              qrClaims++;
            }
            continue;
          }
        }

        // A redemption code typed back ("DADU-WB-3F9A2C") records a redemption.
        const codeMatch = text.toUpperCase().match(/\b[A-Z]{2,6}-[A-Z]{2}-[A-Z0-9]{4,8}\b/);
        if (codeMatch) {
          const message = await getMessageByRedemptionCode(codeMatch[0]);
          if (message && message.profileId === profile.id) {
            // The code is stored as items[0].name so attribution can join
            // redemption events back to the campaign's messages.
            await insertEvent(tenantId, profile.id, {
              eventType: "redemption",
              items: [{ name: codeMatch[0], category: "redemption", qty: 1, unitPrice: 0 }],
              amount: 0,
              ts: new Date(),
              locationId: undefined,
            });
            redemptions++;
            continue;
          }
          // Not a campaign code — maybe a personalized coupon ("DADU-CP-X7K2M9").
          const coupon = await getCouponByCode(tenantId, codeMatch[0]);
          if (
            coupon &&
            coupon.profileId === profile.id &&
            new Date(coupon.expiresAt).getTime() > Date.now() &&
            (await redeemCoupon(tenantId, coupon.id))
          ) {
            await insertEvent(tenantId, profile.id, {
              eventType: "redemption",
              items: [{ name: coupon.code, category: "coupon", qty: 1, unitPrice: 0 }],
              amount: 0,
              ts: new Date(),
              locationId: undefined,
            });
            redemptions++;
          }
        }
      }
    }
  }
  return { replies, optOuts, redemptions, qrClaims };
}

function hashish(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).slice(0, 8);
}
