// WhatsApp webhook endpoints (Meta Cloud API shape).
// Routing is per-tenant by slug in the path — one webhook URL per tenant's
// WhatsApp number. TODO(whatsapp-live): register these URLs in the Meta app
// dashboard and validate X-Hub-Signature-256 against the app secret.

import { Router } from "express";
import { handleWhatsAppInboundWebhook, handleWhatsAppStatusWebhook } from "@hpas/channels";
import { getTenantBySlug } from "@hpas/db";

export const webhooksRouter: import("express").Router = Router();

/** Meta's verification handshake (GET with hub.challenge echo). */
webhooksRouter.get("/whatsapp/:tenantSlug", (req, res) => {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "dev-verify-token";
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === verifyToken
  ) {
    res.send(req.query["hub.challenge"]);
    return;
  }
  res.sendStatus(403);
});

webhooksRouter.post("/whatsapp/:tenantSlug", async (req, res) => {
  const tenant = await getTenantBySlug(req.params.tenantSlug);
  if (!tenant) {
    res.sendStatus(404);
    return;
  }
  const statuses = await handleWhatsAppStatusWebhook(req.body);
  const inbound = await handleWhatsAppInboundWebhook(tenant.id, req.body);
  res.json({ ok: true, statuses, ...inbound });
});
