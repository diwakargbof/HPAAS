// Inventory wiring point: core computation (deterministic) + one batched,
// optional AI call for rationale text — same pattern as pricing.ts. Callable
// both as a tenant-triggered "Recompute now" (from the API route) and as a
// nightly sweep across every tracked tenant (see refreshReorderSuggestions
// vs predictInventoryJob below, and cron/nightly.ts's direct call — not a
// separate Vercel Cron endpoint, staying within the Hobby 2-cron-job cap,
// same as runDuePricingPipelines).

import { defaultProvider, generateInventoryRationale } from "@hpas/ai";
import { computeReorderSuggestion } from "@hpas/core";
import {
  getTenantApiKey,
  listMenuItemsWithStock,
  listTenants,
  tenantItemSalesByName,
  upsertReorderSuggestions,
} from "@hpas/db";
import { aiAssistConfig, inventoryConfig, type ReorderSuggestion, type Tenant } from "@hpas/types";

export async function refreshReorderSuggestions(tenant: Tenant): Promise<ReorderSuggestion[]> {
  const config = inventoryConfig(tenant.config);
  const items = await listMenuItemsWithStock(tenant.id, { trackedOnly: true });
  if (items.length === 0) return [];

  const salesByName = await tenantItemSalesByName(tenant.id);
  const now = new Date();

  const computed = items.map((item) => {
    const signal = salesByName.get(item.name.toLowerCase()) ?? { unitsSold90d: 0, unitsSoldPrior90d: 0 };
    return computeReorderSuggestion(
      {
        menuItemId: item.id,
        name: item.name,
        currentQty: item.currentQty,
        unitsSold90d: signal.unitsSold90d,
        leadTimeDays: item.leadTimeDays ?? config.defaultLeadTimeDays,
        reorderPoint: item.reorderPoint,
        safetyStockDays: config.defaultSafetyStockDays,
      },
      now
    );
  });

  // Optional AI rationale — additive only, same try/catch-and-degrade-gracefully
  // discipline as pricing's rationale. Reuses the pricing surface's toggle
  // (aiAssist.pricing) since Inventory is the same "analytics add-on" surface.
  const assist = aiAssistConfig(tenant.config);
  const secret = assist.pricing ? await getTenantApiKey(tenant.id) : null;
  const provider = defaultProvider({
    aiAssistEnabled: assist.pricing,
    provider: secret?.provider,
    apiKey: secret?.apiKey,
    model: secret?.model,
  });
  let rationaleByItem: Record<string, string> = {};
  try {
    rationaleByItem = await generateInventoryRationale(
      {
        shopName: tenant.config.branding.shopName,
        items: computed.map((c) => ({
          menuItemId: c.menuItemId,
          name: c.name,
          daysOfStockLeft: c.daysOfStockLeft,
          suggestedOrderQty: c.suggestedOrderQty,
          urgency: c.urgency,
        })),
      },
      provider
    );
  } catch {
    rationaleByItem = {};
  }

  const rows = computed.map((c) => ({
    menuItemId: c.menuItemId,
    currentQty: c.currentQty,
    avgDailySales: c.avgDailySales,
    daysOfStockLeft: c.daysOfStockLeft,
    suggestedOrderQty: c.suggestedOrderQty,
    suggestedOrderDate: c.suggestedOrderDate,
    urgency: c.urgency,
    rationale: rationaleByItem[c.menuItemId] ?? null,
  }));
  await upsertReorderSuggestions(tenant.id, rows);

  return rows.map((r) => ({
    ...r,
    name: computed.find((c) => c.menuItemId === r.menuItemId)!.name,
    manualOverrideQty: null,
    computedAt: now.toISOString(),
  }));
}

/** Nightly sweep across every tenant with Inventory enabled — see cron/nightly.ts. */
export async function predictInventoryJob(): Promise<void> {
  const tenants = await listTenants();
  for (const tenant of tenants) {
    if (!tenant.config.modules.inventory?.enabled) continue;
    try {
      const suggestions = await refreshReorderSuggestions(tenant);
      console.log(`[predict-inventory] ${tenant.name}: computed ${suggestions.length} suggestions`);
    } catch (err) {
      console.error(`[predict-inventory] tenant ${tenant.id} failed:`, err);
    }
  }
}
