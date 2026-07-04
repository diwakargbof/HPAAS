// Dashboard API (session-authenticated). Everything is scoped to
// req.tenant — resolved by sessionAuth, never taken from the request body.

import { Router } from "express";
import {
  audienceForSegment,
  computeAttribution,
  renderTemplate,
  TEMPLATE_VARIABLES,
  variablesForProfile,
} from "@hpas/core";
import { sendApprovedCampaign } from "@hpas/channels";
import {
  campaignMessageStats,
  featureStats,
  getCampaign,
  getFeaturesForProfiles,
  getProfilesByIds,
  getSegment,
  getPreferences,
  listCampaigns,
  listSegments,
  messagesForCampaign,
  monthlyRepeatRate,
  setCampaignCopy,
  setCampaignStatus,
  topProfilesByLtv,
  upsertPreference,
} from "@hpas/db";
import { ALL_CAMPAIGN_TYPES, type CampaignType } from "@hpas/types";

export const appRouter: import("express").Router = Router();

/** Session bootstrap: who am I + full tenant config for theming/modules. */
appRouter.get("/me", (req, res) => {
  const t = req.tenant!;
  res.json({ tenant: { id: t.id, name: t.name, config: t.config } });
});

// ---------- insights ----------

appRouter.get("/insights", async (req, res) => {
  const tenant = req.tenant!;
  const [stats, segments, top, trend, campaigns] = await Promise.all([
    featureStats(tenant.id),
    listSegments(tenant.id),
    topProfilesByLtv(tenant.id, 10),
    monthlyRepeatRate(tenant.id, 8),
    listCampaigns(tenant.id, ["sent"]),
  ]);

  const segmentSizes = await Promise.all(
    segments.map(async (s) => ({
      id: s.id,
      name: s.name,
      campaignType: s.campaignType,
      size: (await audienceForSegment(tenant, s)).length,
    }))
  );

  // Revenue impact: sum of incremental revenue across sent campaigns.
  let incrementalRevenue = 0;
  let totalRedemptions = 0;
  for (const c of campaigns) {
    const report = await computeAttribution(tenant, c.id);
    if (report) {
      incrementalRevenue += report.incrementalRevenuePerCustomer * report.messagedCount;
      totalRedemptions += report.redemptions;
    }
  }

  res.json({
    customers: stats,
    segments: segmentSizes,
    topCustomers: top.map((t) => ({
      name: typeof t.traits.name === "string" && t.traits.name ? t.traits.name : "Customer",
      phone: t.phone,
      ltv: t.monetaryLtv,
      recencyDays: t.recencyDays,
      favoriteItem: t.favoriteItem,
    })),
    repeatTrend: trend,
    impact: {
      sentCampaigns: campaigns.length,
      incrementalRevenue: Math.round(incrementalRevenue),
      redemptions: totalRedemptions,
    },
  });
});

// ---------- campaigns (the approval queue) ----------

appRouter.get("/campaigns", async (req, res) => {
  const tenant = req.tenant!;
  const [campaigns, segments] = await Promise.all([
    listCampaigns(tenant.id),
    listSegments(tenant.id),
  ]);
  const segmentById = new Map(segments.map((s) => [s.id, s]));

  const items = await Promise.all(
    campaigns.map(async (c) => {
      const segment = segmentById.get(c.segmentId);
      const stats = await campaignMessageStats(c.id);
      const attribution =
        c.status === "sent" ? await computeAttribution(tenant, c.id) : null;
      return {
        id: c.id,
        status: c.status,
        createdAt: c.createdAt,
        approvedAt: c.approvedAt,
        approvedBy: c.approvedBy,
        audienceSize: c.audienceSize,
        segmentName: segment?.name ?? "",
        campaignType: segment?.campaignType ?? "",
        copy: c.generatedCopy,
        stats,
        attribution,
        hasCallList: Boolean(c.callListCsv),
      };
    })
  );
  res.json({ campaigns: items });
});

/** Approve & Send — the explicit human gate. Nothing sends without this. */
appRouter.post("/campaigns/:id/approve", async (req, res) => {
  const tenant = req.tenant!;
  const campaign = await getCampaign(tenant.id, req.params.id);
  if (!campaign) {
    res.status(404).json({ error: "campaign not found" });
    return;
  }
  if (campaign.status !== "pending_approval") {
    res.status(409).json({ error: `campaign is "${campaign.status}", not pending_approval` });
    return;
  }
  await setCampaignStatus(tenant.id, campaign.id, "approved", tenant.config.slug);
  const result = await sendApprovedCampaign(tenant, campaign.id);
  res.json({ ok: true, result });
});

/** Download the call-list CSV (high-LTV customers routed to a human call), if any. */
appRouter.get("/campaigns/:id/call-list.csv", async (req, res) => {
  const tenant = req.tenant!;
  const campaign = await getCampaign(tenant.id, req.params.id);
  if (!campaign || !campaign.callListCsv) {
    res.status(404).json({ error: "no call list for this campaign" });
    return;
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="call-list-${campaign.id.slice(0, 8)}.csv"`
  );
  res.send(campaign.callListCsv);
});

appRouter.post("/campaigns/:id/reject", async (req, res) => {
  const tenant = req.tenant!;
  const updated = await setCampaignStatus(tenant.id, req.params.id, "rejected");
  if (!updated) {
    res.status(404).json({ error: "campaign not found" });
    return;
  }
  res.json({ ok: true });
});

/** Edit the cached template before approving. Re-validates + re-renders samples. */
appRouter.put("/campaigns/:id/template", async (req, res) => {
  const tenant = req.tenant!;
  const template = String(req.body?.template ?? "").trim();
  if (!template) {
    res.status(400).json({ error: "template is required" });
    return;
  }
  const used = [...template.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]);
  const unknown = used.filter((v) => !TEMPLATE_VARIABLES.includes(v));
  if (unknown.length > 0) {
    res.status(400).json({
      error: `unknown variables: ${unknown.join(", ")} (allowed: ${TEMPLATE_VARIABLES.join(", ")})`,
    });
    return;
  }

  const campaign = await getCampaign(tenant.id, req.params.id);
  if (!campaign || !campaign.generatedCopy) {
    res.status(404).json({ error: "campaign not found" });
    return;
  }
  if (campaign.status !== "pending_approval") {
    res.status(409).json({ error: "only pending campaigns can be edited" });
    return;
  }

  // Re-render samples for the approval UI with the edited template.
  const messages = (await messagesForCampaign(campaign.id)).filter((m) => !m.isControl).slice(0, 3);
  const profileIds = messages.map((m) => m.profileId);
  const [profiles, features] = await Promise.all([
    getProfilesByIds(tenant.id, profileIds),
    getFeaturesForProfiles(tenant.id, profileIds),
  ]);
  const featuresById = new Map(features.map((f) => [f.profileId, f]));

  const copy = {
    ...campaign.generatedCopy,
    template,
    variables: [...new Set(used)],
    provider: `${campaign.generatedCopy.provider}+edited`,
    samples: profiles.map((p) => ({
      profileId: p.id,
      rendered: renderTemplate(
        template,
        variablesForProfile(p, featuresById.get(p.id), {
          shop_name: tenant.config.branding.shopName,
          redemption_code: `${tenant.config.slug.slice(0, 4).toUpperCase()}-SAMPLE`,
          festival_name: "",
        })
      ),
    })),
  };
  await setCampaignCopy(tenant.id, campaign.id, copy);
  res.json({ ok: true, copy });
});

// ---------- attribution ----------

appRouter.get("/attribution/:campaignId", async (req, res) => {
  const tenant = req.tenant!;
  const report = await computeAttribution(tenant, req.params.campaignId);
  if (!report) {
    res.status(404).json({ error: "no attribution available (campaign not sent?)" });
    return;
  }
  res.json(report);
});

// ---------- preferences ----------

appRouter.get("/preferences", async (req, res) => {
  const tenant = req.tenant!;
  const prefs = await getPreferences(tenant.id);
  // Ensure all campaign types are present even if never saved.
  const byType = new Map(prefs.map((p) => [p.campaignType, p]));
  res.json({
    preferences: ALL_CAMPAIGN_TYPES.map(
      (t) =>
        byType.get(t) ?? {
          tenantId: tenant.id,
          campaignType: t,
          enabled: true,
          maxPerCustomerPerWeek: 1,
        }
    ),
  });
});

appRouter.put("/preferences", async (req, res) => {
  const tenant = req.tenant!;
  const updates = Array.isArray(req.body?.preferences) ? req.body.preferences : [];
  for (const u of updates) {
    if (!ALL_CAMPAIGN_TYPES.includes(u.campaignType as CampaignType)) continue;
    await upsertPreference({
      tenantId: tenant.id,
      campaignType: u.campaignType,
      enabled: Boolean(u.enabled),
      maxPerCustomerPerWeek: Math.max(1, Math.min(7, Number(u.maxPerCustomerPerWeek) || 1)),
    });
  }
  res.json({ preferences: await getPreferences(tenant.id) });
});

// ---------- settings ----------

appRouter.get("/settings", async (req, res) => {
  const tenant = req.tenant!;
  res.json({
    shopName: tenant.config.branding.shopName,
    branding: tenant.config.branding,
    whatsapp: {
      number: tenant.whatsappNumber,
      mode: process.env.WHATSAPP_MODE === "live" ? "live" : "stub",
      connected: process.env.WHATSAPP_MODE === "live",
    },
    email: tenant.config.channels.email,
    apiKey: tenant.apiKey,
    festivals: tenant.config.festivals,
  });
});
