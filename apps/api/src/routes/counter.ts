// The Counter: phone lookup -> loyalty + recommendations + pitch, plus
// points adjustments and 1:1 messages. Mounted for the dashboard (session
// auth) and, lookup-only, for POS machines (API key) — the same card a
// tablet at the till or the billing software would show.

import { Router } from "express";
import { normalizePhone } from "@hpas/core";
import { buildCounterCard } from "@hpas/jobs";
import { sendDirectMessage } from "@hpas/channels";
import {
  addLoyaltyPoints,
  directMessagesForProfile,
  getProfile,
  getProfileByPhone,
  loyaltyBalance,
  loyaltyLedger,
} from "@hpas/db";

export const counterRouter: import("express").Router = Router();

/** Full counter card by phone. ?refresh=1 bypasses the 24h pitch cache. */
counterRouter.get("/counter", async (req, res) => {
  const tenant = req.tenant!;
  const phone = normalizePhone(String(req.query.phone ?? ""));
  if (!phone) {
    res.status(400).json({ error: "valid phone is required (?phone=)" });
    return;
  }
  const profile = await getProfileByPhone(tenant.id, phone);
  if (!profile) {
    res.status(404).json({ error: "no customer with that number yet" });
    return;
  }

  const [card, ledger, recentMessages] = await Promise.all([
    buildCounterCard(tenant, profile.id, { forceRefresh: req.query.refresh === "1" }),
    loyaltyLedger(tenant.id, profile.id, 10),
    directMessagesForProfile(tenant.id, profile.id, 5),
  ]);
  res.json({ card, ledger, recentMessages });
});

/** Manual points adjustment (award a bonus, redeem at the till). */
counterRouter.post("/loyalty/adjust", async (req, res) => {
  const tenant = req.tenant!;
  const profileId = String(req.body?.profileId ?? "");
  const points = Math.round(Number(req.body?.points));
  const reason = String(req.body?.reason ?? "").trim();
  if (!profileId || !Number.isFinite(points) || points === 0 || !reason) {
    res.status(400).json({ error: "profileId, non-zero points, and reason are required" });
    return;
  }
  const profile = await getProfile(tenant.id, profileId);
  if (!profile) {
    res.status(404).json({ error: "customer not found" });
    return;
  }
  const balance = await loyaltyBalance(tenant.id, profileId);
  if (points < 0 && balance + points < 0) {
    res.status(409).json({ error: `only ${balance} points available` });
    return;
  }
  await addLoyaltyPoints(tenant.id, profileId, points, reason);
  res.json({ balance: balance + points });
});

/** 1:1 message from the owner — recorded separately from campaigns. */
counterRouter.post("/direct-message", async (req, res) => {
  const tenant = req.tenant!;
  const profileId = String(req.body?.profileId ?? "");
  const body = String(req.body?.body ?? "").trim();
  if (!profileId || !body) {
    res.status(400).json({ error: "profileId and body are required" });
    return;
  }
  if (body.length > 1000) {
    res.status(400).json({ error: "message too long (max 1000 chars)" });
    return;
  }
  const profile = await getProfile(tenant.id, profileId);
  if (!profile) {
    res.status(404).json({ error: "customer not found" });
    return;
  }
  const message = await sendDirectMessage(tenant, profile, body, tenant.config.slug);
  if (message.status === "failed") {
    res.status(409).json({ error: "this customer has opted out of messages", message });
    return;
  }
  res.json({ message });
});
