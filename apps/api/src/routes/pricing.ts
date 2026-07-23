// AI Pricing: an optional, admin-gated add-on (tenant.config.modules.pricing
// — turned on for a tenant the same way `billing` was, once they've paid
// outside the app; no in-app payment collection). Tenant configures which
// items to optimize and within what bounds (settings/pricing), then
// tenant-triggers a refresh to get bounded, explainable price
// recommendations, and applies them one at a time (or all at once) — never
// automatic. See KNOWLEDGE_GRAPH.md for the deliberate scope limits.

import { Router } from "express";
import { refreshPricingRecommendations } from "@hpas/jobs";
import {
  getPriceRecommendation,
  listMenuItems,
  listPriceRecommendations,
  patchTenantConfig,
  updateMenuItemPrice,
  upsertMenuItemBranchPrice,
} from "@hpas/db";
import {
  pricingConfig,
  pricingDashboardConfig,
  type PricingConfig,
  type PricingItemConfig,
  type PricingRoundingRule,
  type PricingWidget,
  type PricingWidgetType,
} from "@hpas/types";

const ROUNDING_RULES: PricingRoundingRule[] = ["none", "nearest_5", "nearest_10", "end_99", "end_95"];
const PRICING_WIDGET_TYPES: PricingWidgetType[] = [
  "recommendation_summary",
  "demand_trend_chart",
  "top_movers",
  "needs_review_list",
  "pricing_config_summary",
];

export const pricingRouter: import("express").Router = Router();

pricingRouter.use((req, res, next) => {
  if (!req.tenant!.config.modules.pricing?.enabled) {
    res.status(403).json({ error: "AI Pricing is not enabled for this account" });
    return;
  }
  next();
});

pricingRouter.get("/settings/pricing", (req, res) => {
  res.json({ pricing: pricingConfig(req.tenant!.config) });
});

// ---------- pricing dashboard (configurable widgets) ----------
// Same pattern as /settings/personalization-dashboard: no new data queries,
// every widget renders client-side from /pricing/recommendations, /menu,
// and /settings/pricing. This pair only persists the widget list/order.

pricingRouter.get("/settings/pricing-dashboard", (req, res) => {
  res.json({ dashboard: pricingDashboardConfig(req.tenant!.config) });
});

pricingRouter.put("/settings/pricing-dashboard", async (req, res) => {
  const tenant = req.tenant!;
  const widgetsBody = Array.isArray(req.body?.dashboard?.widgets) ? req.body.dashboard.widgets : [];

  const widgets: PricingWidget[] = widgetsBody
    .filter((w: Partial<PricingWidget>) => PRICING_WIDGET_TYPES.includes(w.type as PricingWidgetType))
    .map((w: Partial<PricingWidget>) => ({
      id: String(w.id ?? "").trim() || `widget-${Math.random().toString(36).slice(2, 10)}`,
      type: w.type as PricingWidgetType,
      ...(w.title ? { title: String(w.title).slice(0, 60) } : {}),
    }));

  await patchTenantConfig(tenant.id, { pricingDashboard: { widgets } });
  res.json({ dashboard: { widgets } });
});

pricingRouter.put("/settings/pricing", async (req, res) => {
  const tenant = req.tenant!;
  const current = pricingConfig(tenant.config);
  const body = req.body?.pricing ?? {};

  const items: Record<string, PricingItemConfig> =
    body.items && typeof body.items === "object"
      ? Object.fromEntries(
          Object.entries(body.items as Record<string, Partial<PricingItemConfig>>).map(([id, v]) => [
            id,
            {
              enabled: Boolean(v.enabled),
              ...(v.minPrice !== undefined && v.minPrice !== null ? { minPrice: Math.max(0, Number(v.minPrice)) } : {}),
              ...(v.maxPrice !== undefined && v.maxPrice !== null ? { maxPrice: Math.max(0, Number(v.maxPrice)) } : {}),
              ...(v.maxChangePercent !== undefined && v.maxChangePercent !== null
                ? { maxChangePercent: Math.max(0, Math.min(100, Number(v.maxChangePercent))) }
                : {}),
              manualOverride: Boolean(v.manualOverride),
            },
          ])
        )
      : current.items;

  const patch: { pricingConfig: PricingConfig } = {
    pricingConfig: {
      applyToAllItems: Boolean(body.applyToAllItems ?? current.applyToAllItems),
      defaultMaxChangePercent: Math.max(
        0,
        Math.min(100, Number(body.defaultMaxChangePercent ?? current.defaultMaxChangePercent))
      ),
      ...(body.occasion ? { occasion: String(body.occasion).trim().slice(0, 100) } : {}),
      roundingRule: ROUNDING_RULES.includes(body.roundingRule) ? body.roundingRule : (current.roundingRule ?? "none"),
      safetyNetEnabled: Boolean(body.safetyNetEnabled ?? current.safetyNetEnabled ?? true),
      useBusinessUnitsInPricing: Boolean(body.useBusinessUnitsInPricing ?? current.useBusinessUnitsInPricing ?? false),
      items,
    },
  };

  await patchTenantConfig(tenant.id, patch);
  res.json({ ok: true });
});

pricingRouter.post("/pricing/refresh", async (req, res) => {
  const tenant = req.tenant!;
  const config = pricingConfig(tenant.config);
  const businessUnitId =
    config.useBusinessUnitsInPricing && typeof req.body?.businessUnitId === "string" ? req.body.businessUnitId : undefined;
  const recommendations = await refreshPricingRecommendations(tenant, { businessUnitId });
  res.json({ recommendations });
});

pricingRouter.get("/pricing/recommendations", async (req, res) => {
  const tenant = req.tenant!;
  const config = pricingConfig(tenant.config);
  const businessUnitId =
    config.useBusinessUnitsInPricing && typeof req.query.businessUnitId === "string" ? req.query.businessUnitId : "";
  const menuItems = await listMenuItems(tenant.id, { businessUnitId: businessUnitId || undefined });
  const targetIds = new Set(
    menuItems
      .filter((m) => (config.applyToAllItems || config.items[m.id]?.enabled) && !config.items[m.id]?.manualOverride)
      .map((m) => m.id)
  );
  const recommendations = (await listPriceRecommendations(tenant.id, businessUnitId)).filter((r) =>
    targetIds.has(r.menuItemId)
  );
  res.json({ recommendations });
});

pricingRouter.post("/pricing/apply", async (req, res) => {
  const tenant = req.tenant!;
  const config = pricingConfig(tenant.config);
  const menuItemId = req.body?.menuItemId ? String(req.body.menuItemId) : null;
  const applyAll = Boolean(req.body?.all);
  const confirmReview = Boolean(req.body?.confirmReview);
  const businessUnitId =
    config.useBusinessUnitsInPricing && typeof req.body?.businessUnitId === "string" ? req.body.businessUnitId : "";

  if (!menuItemId && !applyAll) {
    res.status(400).json({ error: "menuItemId or all is required" });
    return;
  }

  if (menuItemId) {
    const recommendation = await getPriceRecommendation(tenant.id, menuItemId, businessUnitId);
    if (!recommendation) {
      res.status(404).json({ error: "no recommendation found" });
      return;
    }
    if (recommendation.needsReview && !confirmReview) {
      res.status(409).json({ error: "This recommendation needs review before applying" });
      return;
    }
    if (businessUnitId) {
      await upsertMenuItemBranchPrice(tenant.id, recommendation.menuItemId, businessUnitId, recommendation.suggestedPrice);
    } else {
      await updateMenuItemPrice(tenant.id, recommendation.menuItemId, recommendation.suggestedPrice);
    }
    res.json({ applied: 1, skippedNeedsReview: 0 });
    return;
  }

  // Bulk apply never bypasses the safety net — flagged rows are held back,
  // never silently applied, matching the "nothing without approval" rule
  // already enforced for campaigns and discounts.
  const all = await listPriceRecommendations(tenant.id, businessUnitId);
  const applicable = all.filter((r) => !r.needsReview);
  for (const r of applicable) {
    if (businessUnitId) {
      await upsertMenuItemBranchPrice(tenant.id, r.menuItemId, businessUnitId, r.suggestedPrice);
    } else {
      await updateMenuItemPrice(tenant.id, r.menuItemId, r.suggestedPrice);
    }
  }
  res.json({ applied: applicable.length, skippedNeedsReview: all.length - applicable.length });
});
