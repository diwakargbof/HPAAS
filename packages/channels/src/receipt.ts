// Transactional WhatsApp sends: the purchase receipt (bill + loyalty points
// + personalized coupon) and the QR-claim welcome. These are triggered by
// the customer's own purchase — NOT campaigns — so they don't pass the
// campaign approval gate; they do respect opt-outs. Recorded in
// transactional_messages, never in campaign messages.
//
// The QR welcome is always sent inside Meta's 24h customer-service window
// (the customer just messaged us to claim their order), so it goes out as
// free-form text — no approved template required. A receipt fired from a
// bulk CSV import may be outside that window; for production at scale
// that should move to an approved "utility" template, but free-form is
// fine for a live demo. In stub mode we just record the send.

import {
  describeCouponValue,
  maybeIssueCoupon,
  pointsForPurchase,
} from "@hpas/core";
import {
  loyaltyConfig,
  receiptConfig,
  type Coupon,
  type NormalizedEvent,
  type Profile,
  type QrOrder,
  type Tenant,
  type TransactionalKind,
} from "@hpas/types";
import {
  getOptedOutPhones,
  getProfileByPhone,
  insertTransactionalMessage,
  loyaltyBalance,
} from "@hpas/db";

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

export async function sendTransactionalWhatsApp(
  tenant: Tenant,
  profile: Pick<Profile, "id" | "phone">,
  kind: TransactionalKind,
  body: string
): Promise<{ status: "sent" | "failed" }> {
  const optedOut = await getOptedOutPhones(tenant.id);
  const blocked = optedOut.has(profile.phone);

  let liveSendFailed = false;
  if (!blocked && process.env.WHATSAPP_MODE === "live") {
    const res = await fetch(`${GRAPH_API_BASE}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: profile.phone.replace(/\D/g, ""),
        type: "text",
        text: { body },
      }),
    });
    if (!res.ok) {
      liveSendFailed = true;
      const errBody = await res.json().catch(() => ({}));
      console.error(`[whatsapp] transactional send (${kind}) failed:`, errBody);
    }
  }

  const status = blocked || liveSendFailed ? "failed" : "sent";
  await insertTransactionalMessage({
    tenantId: tenant.id,
    profileId: profile.id,
    kind,
    body,
    status,
  });
  return { status };
}

function couponLines(coupon: Coupon | null): string[] {
  if (!coupon) return [];
  const expires = new Date(coupon.expiresAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return [
    "",
    `🎁 A little thank-you, just for you: *${describeCouponValue(coupon)}* on your next visit.`,
    `Your code: *${coupon.code}* (valid till ${expires})`,
    `Show it at the counter or reply with the code to redeem.`,
  ];
}

function loyaltyLines(tenant: Tenant, pointsEarned: number, balance: number): string[] {
  const cfg = loyaltyConfig(tenant.config);
  if (!cfg.enabled) return [];
  const valueRupees = Math.floor(balance * cfg.pointValueRupees);
  return [
    "",
    `⭐ You earned *${pointsEarned} points* on this order.`,
    `Balance: *${balance} points* (worth ₹${valueRupees}).`,
  ];
}

/** The WhatsApp bill for one purchase. Deterministic text — no LLM. */
export function buildReceiptText(
  tenant: Tenant,
  event: NormalizedEvent,
  pointsEarned: number,
  balance: number,
  coupon: Coupon | null
): string {
  const cfg = receiptConfig(tenant.config);
  const lines: string[] = [
    `🧾 *${tenant.config.branding.shopName}* — thank you for your purchase!`,
    "",
  ];
  if (cfg.showItems && event.items.length > 0) {
    for (const it of event.items) {
      lines.push(`• ${it.name} × ${it.qty} — ₹${Math.round(it.unitPrice * it.qty)}`);
    }
  }
  lines.push(`*Total: ₹${Math.round(event.amount)}*`);
  lines.push(...loyaltyLines(tenant, pointsEarned, balance));
  lines.push(...couponLines(coupon));
  if (cfg.footerNote) lines.push("", cfg.footerNote);
  return lines.join("\n");
}

/**
 * Post-ingest hook for LIVE purchases (streaming POS path only — CSV
 * uploads are history backfills and must never trigger a message blast).
 * For each purchase: bill + points earned + balance + maybe a coupon.
 */
export async function sendPurchaseReceipts(
  tenant: Tenant,
  events: NormalizedEvent[]
): Promise<{ sent: number; couponsIssued: number }> {
  if (!receiptConfig(tenant.config).enabled) return { sent: 0, couponsIssued: 0 };

  let sent = 0;
  let couponsIssued = 0;
  for (const event of events) {
    if (event.eventType !== "purchase") continue;
    const profile = await getProfileByPhone(tenant.id, event.phone);
    if (!profile) continue; // ingest failed for this row; nothing to bill

    const pointsEarned = pointsForPurchase(tenant, event.amount);
    const balance = await loyaltyBalance(tenant.id, profile.id);
    const coupon = await maybeIssueCoupon(tenant, profile.id, event.phone, event.amount, "receipt");
    if (coupon) couponsIssued++;

    const body = buildReceiptText(tenant, event, pointsEarned, balance, coupon);
    const { status } = await sendTransactionalWhatsApp(tenant, profile, "receipt", body);
    if (status === "sent") sent++;
  }
  return { sent, couponsIssued };
}

/**
 * Welcome for a customer who scanned their online-order QR and sent the
 * pre-drafted message: confirms the order is now on their profile, shows
 * points + any coupon. They just messaged us, so the reply is free-form
 * text inside Meta's 24h service window even in live mode.
 */
export async function sendQrWelcome(
  tenant: Tenant,
  profile: Pick<Profile, "id" | "phone">,
  qr: QrOrder,
  coupon: Coupon | null
): Promise<{ status: "sent" | "failed" }> {
  const pointsEarned = pointsForPurchase(tenant, qr.amount);
  const balance = await loyaltyBalance(tenant.id, profile.id);
  const sourceName = qr.source !== "other" ? ` ${cap(qr.source)}` : "";

  const lines: string[] = [
    `🙏 Welcome to *${tenant.config.branding.shopName}*!`,
    "",
    `Your${sourceName} order (₹${Math.round(qr.amount)}) is now linked to your number — from here on you earn rewards on every order, online or in store.`,
  ];
  lines.push(...loyaltyLines(tenant, pointsEarned, balance));
  lines.push(...couponLines(coupon));
  lines.push("", `Reply STOP anytime to unsubscribe.`);

  return sendTransactionalWhatsApp(tenant, profile, "qr_welcome", lines.join("\n"));
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
