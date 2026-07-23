// AI Pricing wiring point: core computation (deterministic) + one batched
// AI call for rationale text, called directly from the API route on
// tenant-triggered "Refresh recommendations" — same pattern as
// counter-card.ts, not on the trigger/campaign path so no injected-callback
// abstraction is needed.

import { generatePricingRationale } from "@hpas/ai";
import { activeFestivalWindow, computePriceRecommendation } from "@hpas/core";
import { listMenuItems, tenantItemSalesByName, upsertPriceRecommendations } from "@hpas/db";
import { pricingConfig, type PriceRecommendation, type Tenant } from "@hpas/types";

export async function refreshPricingRecommendations(
  tenant: Tenant,
  opts: { businessUnitId?: string } = {}
): Promise<PriceRecommendation[]> {
  const businessUnitId = opts.businessUnitId ?? "";
  const config = pricingConfig(tenant.config);
  const menuItems = await listMenuItems(tenant.id, { businessUnitId: businessUnitId || undefined });
  const targets = menuItems.filter(
    (m) =>
      (config.applyToAllItems || config.items[m.id]?.enabled) &&
      !config.items[m.id]?.manualOverride &&
      // listMenuItems already filters to items sold at this branch (or
      // everywhere) when businessUnitId is set — this is belt-and-suspenders.
      (businessUnitId === "" || m.businessUnitIds.length === 0 || m.businessUnitIds.includes(businessUnitId))
  );

  if (targets.length === 0) return [];

  const salesByName = await tenantItemSalesByName(tenant.id, businessUnitId || undefined);
  const window = activeFestivalWindow(tenant, new Date());
  const activeFestival = window ? tenant.config.festivals.find((f) => f.name === window.name) : null;

  const recommendations = targets.map((item) => {
    const itemConfig = config.items[item.id];
    const signal = salesByName.get(item.name.toLowerCase()) ?? { unitsSold90d: 0, unitsSoldPrior90d: 0 };
    const festivalBoost = Boolean(activeFestival?.categories.includes(item.category));
    const currentPrice = businessUnitId ? item.branchPrice ?? item.price : item.price;

    return computePriceRecommendation(
      {
        menuItemId: item.id,
        name: item.name,
        currentPrice,
        unitsSold90d: signal.unitsSold90d,
        unitsSoldPrior90d: signal.unitsSoldPrior90d,
      },
      {
        minPrice: itemConfig?.minPrice,
        maxPrice: itemConfig?.maxPrice,
        maxChangePercent: itemConfig?.maxChangePercent ?? config.defaultMaxChangePercent,
        festivalBoost,
        roundingRule: config.roundingRule,
        safetyNetEnabled: config.safetyNetEnabled,
      }
    );
  });

  const rationaleByItem = await generatePricingRationale({
    shopName: tenant.config.branding.shopName,
    occasion: config.occasion ?? activeFestival?.name ?? null,
    items: recommendations.map((r) => ({
      menuItemId: r.menuItemId,
      name: r.name,
      currentPrice: r.currentPrice,
      suggestedPrice: r.suggestedPrice,
      demandTrend: r.demandTrend,
    })),
  });

  const rows = recommendations.map((r) => ({
    menuItemId: r.menuItemId,
    currentPrice: r.currentPrice,
    suggestedPrice: r.suggestedPrice,
    changePercent: r.changePercent,
    demandTrend: r.demandTrend,
    confidence: r.confidence,
    rationale: rationaleByItem[r.menuItemId] ?? "",
    needsReview: r.needsReview,
    businessUnitId,
  }));
  await upsertPriceRecommendations(tenant.id, rows);

  return recommendations.map((r) => ({
    menuItemId: r.menuItemId,
    name: r.name,
    currentPrice: r.currentPrice,
    suggestedPrice: r.suggestedPrice,
    changePercent: r.changePercent,
    demandTrend: r.demandTrend,
    confidence: r.confidence,
    rationale: rationaleByItem[r.menuItemId] ?? null,
    needsReview: r.needsReview,
    businessUnitId,
    computedAt: new Date(),
  }));
}
