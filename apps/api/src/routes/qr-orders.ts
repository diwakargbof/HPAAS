// QR capture of online (aggregator) customers. Swiggy/Zomato don't share
// customer data, so each online order gets a unique QR (printed on the box
// or a slip): scanning opens WhatsApp with a pre-drafted message carrying
// the order token. The customer pressing send is the moment their phone
// number — and the order — enters the system (claim happens in the
// WhatsApp inbound webhook).

import { Router } from "express";
import QRCode from "qrcode";
import { generateQrToken } from "@hpas/core";
import { qrCaptureConfig, type EventItem, type QrOrder, type Tenant } from "@hpas/types";
import { createQrOrder, getQrOrderByToken, getTenantById, listQrOrders } from "@hpas/db";

export const qrOrdersRouter: import("express").Router = Router();

/** Base URL for claim links: env in deploys, request host as dev fallback. */
function publicBaseUrl(req: import("express").Request): string {
  return process.env.PUBLIC_API_URL ?? `${req.protocol}://${req.get("host")}`;
}

/**
 * The {{name}} slot is what lets the inbound webhook read the customer's
 * name straight out of the message text (see NAME_FROM_MESSAGE_RE in
 * whatsapp.ts) instead of depending on their WhatsApp account having a
 * display name set at all.
 */
function prefilledMessage(tenant: Tenant, token: string, name: string): string {
  const template =
    qrCaptureConfig(tenant.config).messageTemplate ??
    "Hi {{shop_name}}! This is {{name}}, adding my order {{token}} to my rewards ✨";
  return template
    .replaceAll("{{shop_name}}", tenant.config.branding.shopName)
    .replaceAll("{{name}}", name)
    .replaceAll("{{token}}", token);
}

function waLink(tenant: Tenant, token: string, name: string): string {
  const number = tenant.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(prefilledMessage(tenant, token, name))}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function namePromptPage(tenant: Tenant, token: string): string {
  const shop = escapeHtml(tenant.config.branding.shopName);
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${shop} — join on WhatsApp</title>
<style>
body{font-family:system-ui,sans-serif;max-width:420px;margin:60px auto;padding:0 20px;color:#2a2420}
h1{font-size:1.3rem}
input{width:100%;padding:12px;font-size:1rem;border:1px solid #ccc;border-radius:8px;margin:12px 0;box-sizing:border-box}
button{width:100%;padding:12px;font-size:1rem;border:none;border-radius:8px;background:#25D366;color:#fff;font-weight:600}
</style></head><body>
<h1>${shop}</h1>
<p>What's your name? We'll use it to greet you on WhatsApp.</p>
<form method="get" action="/q/${encodeURIComponent(token)}">
  <input name="name" placeholder="Your name" required maxlength="80" autofocus>
  <button type="submit">Continue to WhatsApp</button>
</form>
</body></html>`;
}

function qrOrderView(req: import("express").Request, tenant: Tenant, qr: QrOrder) {
  const base = publicBaseUrl(req);
  return {
    ...qr,
    claimUrl: `${base}/q/${qr.token}`,
    qrSvgUrl: `${base}/q/${qr.token}/qr.svg`,
    // Real customers go through claimUrl (the name prompt), not this one —
    // this is just an informational preview for the dashboard.
    waLink: waLink(tenant, qr.token, "there"),
  };
}

/**
 * POST /v1/qr-orders — called per online order by the shop's aggregator
 * bridge (or manually from the dashboard). Returns the claim URL + QR
 * image URL to print with the order.
 */
qrOrdersRouter.post("/qr-orders", async (req, res) => {
  const tenant = req.tenant!;
  if (!qrCaptureConfig(tenant.config).enabled) {
    res.status(409).json({ error: "QR capture is disabled for this shop" });
    return;
  }
  const orderRef = String(req.body?.order_ref ?? "").trim();
  const amount = Number(req.body?.amount);
  if (!orderRef || !Number.isFinite(amount) || amount < 0) {
    res.status(400).json({ error: "order_ref and a non-negative amount are required" });
    return;
  }
  const items: EventItem[] = Array.isArray(req.body?.items)
    ? req.body.items.map((it: Partial<EventItem>) => ({
        name: String(it.name ?? ""),
        category: String(it.category ?? "uncategorized"),
        qty: Number(it.qty) || 1,
        unitPrice: Number(it.unitPrice) || 0,
      }))
    : [];

  const qr = await createQrOrder({
    tenantId: tenant.id,
    token: generateQrToken(),
    orderRef,
    source: String(req.body?.source ?? "other").toLowerCase(),
    amount,
    items,
  });
  res.json({ qrOrder: qrOrderView(req, tenant, qr) });
});

/** GET /v1/qr-orders — recent QRs with claim status, for the dashboard. */
qrOrdersRouter.get("/qr-orders", async (req, res) => {
  const tenant = req.tenant!;
  const orders = await listQrOrders(tenant.id, 50);
  res.json({ qrOrders: orders.map((qr) => qrOrderView(req, tenant, qr)) });
});

// ---------- public claim surface (no auth: the unguessable token IS the
// credential, and it resolves the tenant — never the request body) ----------

export const qrPublicRouter: import("express").Router = Router();

/**
 * The QR points here. First visit: ask for the customer's name (so the
 * webhook can read it out of the message text rather than hoping their
 * WhatsApp account has a display name set). Once ?name= is present, bounce
 * straight into WhatsApp with the pre-draft.
 */
qrPublicRouter.get("/:token", async (req, res) => {
  const qr = await getQrOrderByToken(String(req.params.token).toUpperCase());
  const tenant = qr && (await getTenantById(qr.tenantId));
  if (!qr || !tenant) {
    res.status(404).send("This QR code is not valid.");
    return;
  }
  const name = String(req.query.name ?? "").trim();
  if (!name) {
    res.type("html").send(namePromptPage(tenant, qr.token));
    return;
  }
  // Already-claimed tokens still open the chat — harmless, and the webhook
  // claim is idempotent either way.
  res.redirect(302, waLink(tenant, qr.token, name));
});

/** Printable QR (SVG) encoding the claim URL above. */
qrPublicRouter.get("/:token/qr.svg", async (req, res) => {
  const qr = await getQrOrderByToken(String(req.params.token).toUpperCase());
  if (!qr) {
    res.status(404).send("This QR code is not valid.");
    return;
  }
  const svg = await QRCode.toString(`${publicBaseUrl(req)}/q/${qr.token}`, {
    type: "svg",
    margin: 1,
    width: 512,
  });
  res.type("image/svg+xml").send(svg);
});
