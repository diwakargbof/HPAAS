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
  getTenantAiProviderInfo,
  getTenantChannelInfo,
  getTenantChannelSecrets,
  listActivePlatformNotifications,
  listCampaigns,
  listCustomers,
  listSegments,
  messagesForCampaign,
  monthlyRepeatRate,
  patchTenantConfig,
  setCampaignCopy,
  setCampaignStatus,
  setTenantApiKey,
  setTenantChannelSecrets,
  topProfilesByLtv,
  upsertPreference,
} from "@hpas/db";
import {
  ALL_CAMPAIGN_TYPES,
  aiAssistConfig,
  businessUnitsConfig,
  couponConfig,
  personalizationDashboardConfig,
  qrCaptureConfig,
  receiptConfig,
  type BusinessUnit,
  type CampaignType,
  type CouponTier,
  type PersonalizationWidget,
  type PersonalizationWidgetType,
} from "@hpas/types";

function csvField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  return [headers, ...rows].map((row) => row.map(csvField).join(",")).join("\r\n");
}

const PERSONALIZATION_WIDGET_TYPES: PersonalizationWidgetType[] = [
  "customer_stats",
  "repeat_trend",
  "segment_sizes",
  "top_customers",
  "campaign_ab_compare",
  "campaign_impact",
];

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

const CUSTOMER_SORTS = ["recent", "ltv", "purchases", "alphabetical"] as const;

appRouter.get("/customers", async (req, res) => {
  const tenant = req.tenant!;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const sortParam = String(req.query.sort ?? "recent");
  const sort = (CUSTOMER_SORTS as readonly string[]).includes(sortParam)
    ? (sortParam as (typeof CUSTOMER_SORTS)[number])
    : "recent";

  const businessUnitId = typeof req.query.businessUnitId === "string" ? req.query.businessUnitId : undefined;
  const customers = await listCustomers(tenant.id, { search, sort, limit: 500, businessUnitId });
  res.json({
    customers: customers.map((c) => ({
      id: c.id,
      name: typeof c.traits.name === "string" && c.traits.name ? c.traits.name : "Customer",
      phone: c.phone,
      ltv: c.ltv,
      purchases90d: c.purchases90d,
      recencyDays: c.recencyDays,
      favoriteItem: c.favoriteItem,
      joinedAt: c.createdAt,
    })),
  });
});

/** Personalization > Settings > Download Data: every customer as CSV. */
appRouter.get("/customers/export.csv", async (req, res) => {
  const tenant = req.tenant!;
  const customers = await listCustomers(tenant.id, { sort: "recent", limit: 5000 });
  const csv = toCsv(
    ["name", "phone", "ltv", "purchases90d", "recencyDays", "favoriteItem", "joinedAt"],
    customers.map((c) => [
      typeof c.traits.name === "string" && c.traits.name ? c.traits.name : "Customer",
      c.phone,
      c.ltv ?? "",
      c.purchases90d ?? "",
      c.recencyDays ?? "",
      c.favoriteItem ?? "",
      c.createdAt,
    ])
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="customers.csv"`);
  res.send(csv);
});

/** Personalization > Settings > Download Data: one segment's audience as CSV. */
appRouter.get("/segments/:id/export.csv", async (req, res) => {
  const tenant = req.tenant!;
  const segment = await getSegment(tenant.id, req.params.id);
  if (!segment) {
    res.status(404).json({ error: "segment not found" });
    return;
  }
  const features = await audienceForSegment(tenant, segment);
  const profiles = await getProfilesByIds(tenant.id, features.map((f) => f.profileId));
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const csv = toCsv(
    ["name", "phone", "recencyDays", "frequency90d", "monetaryLtv", "favoriteItem"],
    features.map((f) => {
      const profile = profileById.get(f.profileId);
      const name = typeof profile?.traits.name === "string" && profile.traits.name ? profile.traits.name : "Customer";
      return [name, profile?.phone ?? "", f.recencyDays, f.frequency90d, f.monetaryLtv, f.favoriteItem ?? ""];
    })
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="segment-${segment.name.replace(/[^a-z0-9]/gi, "-")}.csv"`);
  res.send(csv);
});

// ---------- platform notifications ----------

appRouter.get("/notifications", async (_req, res) => {
  res.json({ notifications: await listActivePlatformNotifications() });
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

// ---------- engagement settings (receipts, coupons, QR capture) ----------
// Admin-editable at runtime; persisted into tenants.config so onboarding
// stays zero-code (the same fields can be pre-seeded in config.json).

appRouter.get("/settings/engagement", (req, res) => {
  const config = req.tenant!.config;
  res.json({
    receipts: receiptConfig(config),
    coupons: couponConfig(config),
    qrCapture: qrCaptureConfig(config),
  });
});

appRouter.put("/settings/engagement", async (req, res) => {
  const tenant = req.tenant!;
  const body = req.body ?? {};

  const tiers: CouponTier[] = (Array.isArray(body.coupons?.tiers) ? body.coupons.tiers : [])
    .map((t: Partial<CouponTier>) => ({
      minAmount: Math.max(0, Number(t.minAmount) || 0),
      discountType: t.discountType === "flat" ? ("flat" as const) : ("percent" as const),
      discountValue: Math.max(0, Number(t.discountValue) || 0),
      validityDays: Math.max(1, Math.min(365, Number(t.validityDays) || 30)),
    }))
    .filter((t: CouponTier) => t.discountValue > 0);

  if (body.qrCapture?.messageTemplate && !String(body.qrCapture.messageTemplate).includes("{{token}}")) {
    res.status(400).json({ error: "qrCapture.messageTemplate must include {{token}} — that's how the scan links back to the order" });
    return;
  }

  const patch = {
    receipts: {
      enabled: Boolean(body.receipts?.enabled),
      showItems: Boolean(body.receipts?.showItems ?? true),
      ...(body.receipts?.footerNote ? { footerNote: String(body.receipts.footerNote).slice(0, 200) } : {}),
    },
    coupons: {
      enabled: Boolean(body.coupons?.enabled) && tiers.length > 0,
      tiers,
      minDaysBetweenCoupons: Math.max(0, Math.min(90, Number(body.coupons?.minDaysBetweenCoupons) || 7)),
      ...(body.coupons?.codePrefix
        ? { codePrefix: String(body.coupons.codePrefix).replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 6) }
        : {}),
    },
    qrCapture: {
      enabled: Boolean(body.qrCapture?.enabled ?? true),
      ...(body.qrCapture?.messageTemplate
        ? { messageTemplate: String(body.qrCapture.messageTemplate).slice(0, 300) }
        : {}),
    },
  };

  await patchTenantConfig(tenant.id, patch);
  res.json(patch);
});

// ---------- personalization dashboard (configurable widgets) ----------
// No new data queries: widgets are rendered client-side from the existing
// /insights and /campaigns responses. This settings pair only persists the
// tenant's chosen widget list/order/per-widget config.

appRouter.get("/settings/personalization-dashboard", (req, res) => {
  res.json({ dashboard: personalizationDashboardConfig(req.tenant!.config) });
});

appRouter.put("/settings/personalization-dashboard", async (req, res) => {
  const tenant = req.tenant!;
  const widgetsBody = Array.isArray(req.body?.dashboard?.widgets) ? req.body.dashboard.widgets : [];

  const widgets: PersonalizationWidget[] = widgetsBody
    .filter((w: Partial<PersonalizationWidget>) => PERSONALIZATION_WIDGET_TYPES.includes(w.type as PersonalizationWidgetType))
    .map((w: Partial<PersonalizationWidget>) => ({
      id: String(w.id ?? "").trim() || `widget-${Math.random().toString(36).slice(2, 10)}`,
      type: w.type as PersonalizationWidgetType,
      ...(w.title ? { title: String(w.title).slice(0, 60) } : {}),
      ...(w.config?.campaignId ? { config: { campaignId: String(w.config.campaignId) } } : {}),
    }));

  await patchTenantConfig(tenant.id, { personalizationDashboard: { widgets } });
  res.json({ dashboard: { widgets } });
});

// ---------- business units (branches/regions) ----------
// A tag/filter dimension shared by Personalization and Pricing — managed
// from either area's Settings page, both hitting this same pair of routes.

appRouter.get("/settings/business-units", (req, res) => {
  res.json(businessUnitsConfig(req.tenant!.config));
});

appRouter.put("/settings/business-units", async (req, res) => {
  const tenant = req.tenant!;
  const unitsBody = Array.isArray(req.body?.units) ? req.body.units : [];
  const units: BusinessUnit[] = unitsBody
    .map((u: Partial<BusinessUnit>) => ({
      id: String(u.id ?? "").trim() || `bu-${Math.random().toString(36).slice(2, 10)}`,
      name: String(u.name ?? "").trim(),
    }))
    .filter((u: BusinessUnit) => u.name.length > 0)
    .slice(0, 50);
  const enabled = Boolean(req.body?.enabled);

  await patchTenantConfig(tenant.id, { businessUnits: { enabled, units } });
  res.json({ enabled, units });
});

// ---------- AI assist (per-tenant, opt-in LLM usage for Personalization + Pricing) ----------
// Off by default. The API key itself is never returned by GET — only a
// masked hasApiKey boolean (see getTenantAiProviderInfo/setTenantApiKey).
// Covers both areas, so this lives on the tenant-wide settings router, not
// pricingRouter or a future inventoryRouter.

appRouter.get("/settings/ai-assist", async (req, res) => {
  const tenant = req.tenant!;
  const info = await getTenantAiProviderInfo(tenant.id);
  res.json({ aiAssist: aiAssistConfig(tenant.config), ...info });
});

appRouter.put("/settings/ai-assist", async (req, res) => {
  const tenant = req.tenant!;
  const body = req.body ?? {};

  await patchTenantConfig(tenant.id, {
    aiAssist: {
      personalization: Boolean(body.personalization),
      pricing: Boolean(body.pricing),
    },
  });

  const secretPatch: Parameters<typeof setTenantApiKey>[1] = {};
  if (typeof body.provider === "string" && body.provider.trim()) secretPatch.provider = body.provider.trim().toLowerCase();
  if (typeof body.apiKey === "string") secretPatch.apiKey = body.apiKey.trim() || null;
  if ("model" in body) secretPatch.model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : null;
  if (Object.keys(secretPatch).length > 0) {
    await setTenantApiKey(tenant.id, secretPatch);
  }

  res.json({ ok: true });
});

// ---------- settings ----------

appRouter.get("/settings", async (req, res) => {
  const tenant = req.tenant!;
  const secrets = await getTenantChannelSecrets(tenant.id);
  res.json({
    shopName: tenant.config.branding.shopName,
    branding: tenant.config.branding,
    whatsapp: {
      number: tenant.whatsappNumber,
      mode: secrets.whatsappMode,
      connected: secrets.whatsappMode === "live",
    },
    email: tenant.config.channels.email,
    apiKey: tenant.apiKey,
    festivals: tenant.config.festivals,
  });
});

// ---------- channels (WhatsApp + email credentials, per tenant) ----------
// Each tenant has their own WhatsApp Business number and, optionally, their
// own email sender — no longer a single platform-wide env var. A tenant's
// own saved value always overrides the platform env var of the same name
// (see getTenantChannelSecrets); GET here never returns a raw secret, only
// masked booleans.

appRouter.get("/settings/channels", async (req, res) => {
  res.json(await getTenantChannelInfo(req.tenant!.id));
});

appRouter.put("/settings/channels", async (req, res) => {
  const tenant = req.tenant!;
  const body = req.body ?? {};
  const patch: Parameters<typeof setTenantChannelSecrets>[1] = {};

  if (body.whatsappMode === "live" || body.whatsappMode === "stub") patch.whatsappMode = body.whatsappMode;
  if (typeof body.whatsappPhoneNumberId === "string") patch.whatsappPhoneNumberId = body.whatsappPhoneNumberId.trim() || null;
  if (typeof body.whatsappAccessToken === "string") patch.whatsappAccessToken = body.whatsappAccessToken.trim() || null;
  if (typeof body.whatsappWebhookVerifyToken === "string") {
    patch.whatsappWebhookVerifyToken = body.whatsappWebhookVerifyToken.trim() || null;
  }
  if (body.emailMode === "resend" || body.emailMode === "stub") patch.emailMode = body.emailMode;
  if (typeof body.resendApiKey === "string") patch.resendApiKey = body.resendApiKey.trim() || null;

  if (Object.keys(patch).length > 0) {
    await setTenantChannelSecrets(tenant.id, patch);
  }
  res.json({ ok: true });
});
