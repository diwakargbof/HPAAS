// AI Pricing repos: per-item 90-day vs prior-90-day sales signal (matched
// to menu items by name in JS, same idiom as gst.ts's menuItemsByName —
// events store item name/qty/unitPrice in JSONB, not a menu_item_id FK)
// and the cached price_recommendations table.

import type { PriceRecommendation } from "@hpas/types";
import { query, queryOne } from "./client.js";

export interface ItemSalesSignal {
  unitsSold90d: number;
  unitsSoldPrior90d: number;
}

/** Every sold item name (lowercased) -> its 90-day vs prior-90-day units sold. */
export async function tenantItemSalesByName(tenantId: string): Promise<Map<string, ItemSalesSignal>> {
  const rows = await query<any>(
    `SELECT item->>'name' AS name,
            coalesce(sum((item->>'qty')::numeric) FILTER (WHERE e.ts >= now() - interval '90 days'), 0) AS units_90d,
            coalesce(sum((item->>'qty')::numeric)
              FILTER (WHERE e.ts >= now() - interval '180 days' AND e.ts < now() - interval '90 days'), 0) AS units_prior_90d
     FROM events e, jsonb_array_elements(e.items) AS item
     WHERE e.tenant_id = $1 AND e.event_type = 'purchase' AND item->>'name' <> ''
     GROUP BY 1`,
    [tenantId]
  );
  return new Map(
    rows.map((r) => [
      String(r.name).toLowerCase(),
      { unitsSold90d: Number(r.units_90d), unitsSoldPrior90d: Number(r.units_prior_90d) },
    ])
  );
}

const mapPriceRecommendation = (r: any): PriceRecommendation => ({
  menuItemId: r.menu_item_id,
  name: r.name,
  currentPrice: Number(r.current_price),
  suggestedPrice: Number(r.suggested_price),
  changePercent: Number(r.change_percent),
  demandTrend: r.demand_trend,
  confidence: r.confidence,
  rationale: r.rationale,
  computedAt: r.computed_at,
});

export async function upsertPriceRecommendations(
  tenantId: string,
  rows: Array<{
    menuItemId: string;
    currentPrice: number;
    suggestedPrice: number;
    changePercent: number;
    demandTrend: "rising" | "falling" | "flat";
    confidence: "low" | "medium" | "high";
    rationale: string;
  }>
): Promise<void> {
  for (const r of rows) {
    await query(
      `INSERT INTO price_recommendations
         (tenant_id, menu_item_id, current_price, suggested_price, change_percent, demand_trend, confidence, rationale, computed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
       ON CONFLICT (tenant_id, menu_item_id) DO UPDATE SET
         current_price = EXCLUDED.current_price,
         suggested_price = EXCLUDED.suggested_price,
         change_percent = EXCLUDED.change_percent,
         demand_trend = EXCLUDED.demand_trend,
         confidence = EXCLUDED.confidence,
         rationale = EXCLUDED.rationale,
         computed_at = now()`,
      [tenantId, r.menuItemId, r.currentPrice, r.suggestedPrice, r.changePercent, r.demandTrend, r.confidence, r.rationale]
    );
  }
}

export async function listPriceRecommendations(tenantId: string): Promise<PriceRecommendation[]> {
  const rows = await query<any>(
    `SELECT pr.*, m.name
     FROM price_recommendations pr
     JOIN menu_items m ON m.id = pr.menu_item_id AND m.tenant_id = pr.tenant_id
     WHERE pr.tenant_id = $1
     ORDER BY m.category, m.name`,
    [tenantId]
  );
  return rows.map(mapPriceRecommendation);
}

export async function getPriceRecommendation(tenantId: string, menuItemId: string): Promise<PriceRecommendation | null> {
  const row = await queryOne<any>(
    `SELECT pr.*, m.name
     FROM price_recommendations pr
     JOIN menu_items m ON m.id = pr.menu_item_id AND m.tenant_id = pr.tenant_id
     WHERE pr.tenant_id = $1 AND pr.menu_item_id = $2`,
    [tenantId, menuItemId]
  );
  return row ? mapPriceRecommendation(row) : null;
}
