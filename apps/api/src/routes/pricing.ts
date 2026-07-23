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
} from "@hpas/db";
import { pricingConfig, type PricingConfig, type PricingItemConfig } from "@hpas/types";

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
      items,
    },
  };

  await patchTenantConfig(tenant.id, patch);
  res.json({ ok: true });
});

pricingRouter.post("/pricing/refresh", async (req, res) => {
  const tenant = req.tenant!;
  const recommendations = await refreshPricingRecommendations(tenant);
  res.json({ recommendations });
});

pricingRouter.get("/pricing/recommendations", async (req, res) => {
  const tenant = req.tenant!;
  const config = pricingConfig(tenant.config);
  const menuItems = await listMenuItems(tenant.id);
  const targetIds = new Set(
    config.applyToAllItems ? menuItems.map((m) => m.id) : menuItems.filter((m) => config.items[m.id]?.enabled).map((m) => m.id)
  );
  const recommendations = (await listPriceRecommendations(tenant.id)).filter((r) => targetIds.has(r.menuItemId));
  res.json({ recommendations });
});

pricingRouter.post("/pricing/apply", async (req, res) => {
  const tenant = req.tenant!;
  const menuItemId = req.body?.menuItemId ? String(req.body.menuItemId) : null;
  const applyAll = Boolean(req.body?.all);

  if (!menuItemId && !applyAll) {
    res.status(400).json({ error: "menuItemId or all is required" });
    return;
  }

  const recommendations = applyAll
    ? await listPriceRecommendations(tenant.id)
    : [await getPriceRecommendation(tenant.id, menuItemId!)].filter((r): r is NonNullable<typeof r> => r !== null);

  if (recommendations.length === 0) {
    res.status(404).json({ error: "no recommendation found" });
    return;
  }

  for (const r of recommendations) {
    await updateMenuItemPrice(tenant.id, r.menuItemId, r.suggestedPrice);
  }
  res.json({ applied: recommendations.length });
});
