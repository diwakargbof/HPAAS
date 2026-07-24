// Inventory's deterministic core: a bounded, explainable sales-velocity
// heuristic (rolling 90-day average daily sales -> days-of-stock-left ->
// reorder qty/date), not a demand-forecasting model — a small shop's
// transaction volume can't support one. Mirrors pricing.ts's shape: no LLM
// anywhere here, an optional AI rationale is layered on top by
// packages/jobs/src/predict-inventory.ts and never changes these numbers.

import { inventoryConfig, type Tenant } from "@hpas/types";
import { recordStockAdjustment } from "@hpas/db";

export interface ItemStockSignal {
  menuItemId: string;
  name: string;
  currentQty: number;
  unitsSold90d: number;
  /** Item override; falls back to inventoryConfig().defaultLeadTimeDays. */
  leadTimeDays: number;
  /** Item override; null = derive from safetyStockDays * velocity. */
  reorderPoint: number | null;
  /** From inventoryConfig(). */
  safetyStockDays: number;
}

export interface ReorderComputation {
  menuItemId: string;
  name: string;
  currentQty: number;
  avgDailySales: number;
  /** null = no sales history yet to estimate a velocity. */
  daysOfStockLeft: number | null;
  suggestedOrderQty: number;
  /** ISO date. */
  suggestedOrderDate: string;
  urgency: "low" | "medium" | "high";
}

function addDays(base: Date, days: number): string {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

/** Pure function, no I/O — one item's reorder suggestion from its sales signal. */
export function computeReorderSuggestion(signal: ItemStockSignal, now: Date): ReorderComputation {
  const avgDailySales = signal.unitsSold90d / 90;
  const daysOfStockLeft = avgDailySales > 0 ? signal.currentQty / avgDailySales : null;

  const reorderPoint = signal.reorderPoint ?? avgDailySales * signal.safetyStockDays;
  const needsReorder = daysOfStockLeft !== null && signal.currentQty <= reorderPoint;

  const targetCoverDays = signal.safetyStockDays + signal.leadTimeDays;
  const suggestedOrderQty =
    avgDailySales > 0 ? Math.max(0, Math.ceil(avgDailySales * targetCoverDays - signal.currentQty)) : 0;

  const daysUntilOrder = daysOfStockLeft !== null ? Math.max(0, daysOfStockLeft - signal.leadTimeDays) : 0;
  const suggestedOrderDate = addDays(now, needsReorder ? 0 : Math.ceil(daysUntilOrder));

  const urgency: "low" | "medium" | "high" =
    daysOfStockLeft === null
      ? "low"
      : daysOfStockLeft <= signal.leadTimeDays
        ? "high"
        : daysOfStockLeft <= signal.leadTimeDays + signal.safetyStockDays
          ? "medium"
          : "low";

  return {
    menuItemId: signal.menuItemId,
    name: signal.name,
    currentQty: signal.currentQty,
    avgDailySales,
    daysOfStockLeft,
    suggestedOrderQty,
    suggestedOrderDate,
    urgency,
  };
}

/**
 * Sale-driven auto-decrement, called from ingestion (see ingestion.ts) right
 * next to loyalty's award-on-purchase, so stock stays live rather than only
 * nightly-batched. Matches purchase items to tracked menu items by name, the
 * same way ai-pricing's sales signal does (events store item names, not a
 * menu_item_id FK). No-op — and no query — for tenants with nothing tracked.
 */
export async function decrementStockForSale(
  tenant: Tenant,
  purchasedItems: Array<{ name: string; qty: number }>,
  trackedItemsByName: Map<string, { menuItemId: string }>,
  eventId?: string
): Promise<void> {
  const cfg = inventoryConfig(tenant.config);
  if (!cfg.autoDecrementFromSales || trackedItemsByName.size === 0) return;

  for (const item of purchasedItems) {
    const tracked = trackedItemsByName.get(item.name.toLowerCase());
    if (!tracked || item.qty <= 0) continue;
    await recordStockAdjustment(
      tenant.id,
      tracked.menuItemId,
      -item.qty,
      "sale",
      eventId ? `Purchase event ${eventId}` : "Purchase"
    );
  }
}
