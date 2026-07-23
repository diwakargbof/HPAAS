// AI Pricing wiring point: core computation (deterministic) + one batched
// AI call for rationale text, called directly from the API route on
// tenant-triggered "Refresh recommendations" — same pattern as
// counter-card.ts, not on the trigger/campaign path so no injected-callback
// abstraction is needed.

import { generatePricingRationale } from "@hpas/ai";
import { activeFestivalWindow, computePriceRecommendation } from "@hpas/core";
import { listMenuItems, tenantItemSalesByName, upsertPriceRecommendations } from "@hpas/db";
import { pricingConfig, type PriceRecommendation, type Tenant } from "@hpas/types";

export async function refreshPricingRecommendations(tenant: Tenant): Promise<PriceRecommendation[]> {
  const config = pricingConfig(tenant.config);
  const menuItems = await listMenuItems(tenant.id);
  const targets = config.applyToAllItems
    ? menuItems
    : menuItems.filter((m) => config.items[m.id]?.enabled);

  if (targets.length === 0) return [];

  const salesByName = await tenantItemSalesByName(tenant.id);
  const window = activeFestivalWindow(tenant, new Date());
  const activeFestival = window ? tenant.config.festivals.find((f) => f.name === window.name) : null;

  const recommendations = targets.map((item) => {
    const itemConfig = config.items[item.id];
    const signal = salesByName.get(item.name.toLowerCase()) ?? { unitsSold90d: 0, unitsSoldPrior90d: 0 };
    const festivalBoost = Boolean(activeFestival?.categories.includes(item.category));

    return computePriceRecommendation(
      {
        menuItemId: item.id,
        name: item.name,
        currentPrice: item.price,
        unitsSold90d: signal.unitsSold90d,
        unitsSoldPrior90d: signal.unitsSoldPrior90d,
      },
      {
        minPrice: itemConfig?.minPrice,
        maxPrice: itemConfig?.maxPrice,
        maxChangePercent: itemConfig?.maxChangePercent ?? config.defaultMaxChangePercent,
        festivalBoost,
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
    computedAt: new Date(),
  }));
}
