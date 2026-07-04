// Redemption entry point for POS: the cashier types the customer's code
// at checkout, the POS (or a thin script) calls this. Ties the redemption
// back to the exact message and campaign that drove the visit.

import { Router } from "express";
import { getMessageByRedemptionCode, getCampaign, insertEvent } from "@hpas/db";

export const redemptionsRouter: import("express").Router = Router();

redemptionsRouter.post("/redemptions", async (req, res) => {
  const tenant = req.tenant!;
  const code = String(req.body?.code ?? "").trim().toUpperCase();
  const amount = Number(req.body?.amount) || 0;
  if (!code) {
    res.status(400).json({ error: "code is required" });
    return;
  }

  const message = await getMessageByRedemptionCode(code);
  if (!message) {
    res.status(404).json({ error: "unknown code" });
    return;
  }
  // Tenant scope check: the code's campaign must belong to the caller.
  const campaign = await getCampaign(tenant.id, message.campaignId);
  if (!campaign) {
    res.status(404).json({ error: "unknown code" });
    return;
  }

  await insertEvent(tenant.id, message.profileId, {
    eventType: "redemption",
    items: [{ name: code, category: "redemption", qty: 1, unitPrice: 0 }],
    amount,
    ts: new Date(),
    locationId: req.body?.location_id ? String(req.body.location_id) : undefined,
  });
  res.json({ ok: true, campaignId: campaign.id, profileId: message.profileId });
});
