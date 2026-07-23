// AI Pricing repos: per-item 90-day vs prior-90-day sales signal (matched
// to menu items by name in JS, same idiom as gst.ts's menuItemsByName —
// events store item name/qty/unitPrice in JSONB, not a menu_item_id FK)
// and the cached price_recommendations table. Recommendations are scoped
// by businessUnitId ("" = tenant-wide/all branches) so a branch that's only
// selling an item at one location doesn't get its price dragged by another
// branch's sales of the same item.

import type { PriceRecommendation } from "@hpas/types";
import { query, queryOne } from "./client.js";

export interface ItemSalesSignal {
  unitsSold90d: number;
  unitsSoldPrior90d: number;
}

/** Every sold item name (lowercased) -> its 90-day vs prior-90-day units sold, optionally scoped to one branch. */
export async function tenantItemSalesByName(
  tenantId: string,
  businessUnitId?: string
): Promise<Map<string, ItemSalesSignal>> {
  const rows = await query<any>(
    `SELECT item->>'name' AS name,
            coalesce(sum((item->>'qty')::numeric) FILTER (WHERE e.ts >= now() - interval '90 days'), 0) AS units_90d,
            coalesce(sum((item->>'qty')::numeric)
              FILTER (WHERE e.ts >= now() - interval '180 days' AND e.ts < now() - interval '90 days'), 0) AS units_prior_90d
     FROM events e, jsonb_array_elements(e.items) AS item
     WHERE e.tenant_id = $1 AND e.event_type = 'purchase' AND item->>'name' <> ''
       AND ($2::text IS NULL OR e.location_id = $2)
     GROUP BY 1`,
    [tenantId, businessUnitId ?? null]
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
  needsReview: r.needs_review,
  businessUnitId: r.business_unit_id ?? "",
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
    needsReview: boolean;
    businessUnitId?: string;
  }>
): Promise<void> {
  for (const r of rows) {
    await query(
      `INSERT INTO price_recommendations
         (tenant_id, menu_item_id, current_price, suggested_price, change_percent, demand_trend, confidence, rationale, needs_review, business_unit_id, computed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
       ON CONFLICT (tenant_id, menu_item_id, business_unit_id) DO UPDATE SET
         current_price = EXCLUDED.current_price,
         suggested_price = EXCLUDED.suggested_price,
         change_percent = EXCLUDED.change_percent,
         demand_trend = EXCLUDED.demand_trend,
         confidence = EXCLUDED.confidence,
         rationale = EXCLUDED.rationale,
         needs_review = EXCLUDED.needs_review,
         computed_at = now()`,
      [
        tenantId,
        r.menuItemId,
        r.currentPrice,
        r.suggestedPrice,
        r.changePercent,
        r.demandTrend,
        r.confidence,
        r.rationale,
        r.needsReview,
        r.businessUnitId ?? "",
      ]
    );
  }
}

export async function listPriceRecommendations(
  tenantId: string,
  businessUnitId = ""
): Promise<PriceRecommendation[]> {
  const rows = await query<any>(
    `SELECT pr.*, m.name
     FROM price_recommendations pr
     JOIN menu_items m ON m.id = pr.menu_item_id AND m.tenant_id = pr.tenant_id
     WHERE pr.tenant_id = $1 AND pr.business_unit_id = $2
     ORDER BY m.category, m.name`,
    [tenantId, businessUnitId]
  );
  return rows.map(mapPriceRecommendation);
}

export async function getPriceRecommendation(
  tenantId: string,
  menuItemId: string,
  businessUnitId = ""
): Promise<PriceRecommendation | null> {
  const row = await queryOne<any>(
    `SELECT pr.*, m.name
     FROM price_recommendations pr
     JOIN menu_items m ON m.id = pr.menu_item_id AND m.tenant_id = pr.tenant_id
     WHERE pr.tenant_id = $1 AND pr.menu_item_id = $2 AND pr.business_unit_id = $3`,
    [tenantId, menuItemId, businessUnitId]
  );
  return row ? mapPriceRecommendation(row) : null;
}
