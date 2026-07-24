// Inventory repos: stock read/write on the existing menu_items catalog
// (no separate item table), the append-only stock_ledger, the cached
// reorder_suggestions table, and the per-tenant AI-assist API key.
// Sales-velocity aggregation is NOT duplicated here — the job reuses
// tenantItemSalesByName() from repos-pricing.ts.

import type { MenuItem, MenuItemStock, ReorderSuggestion, StockLedgerEntry } from "@hpas/types";
import { query, queryOne, withTransaction } from "./client.js";

const mapMenuItemWithStock = (r: any): MenuItem & { branchPrice: number | null } => ({
  id: r.id,
  tenantId: r.tenant_id,
  name: r.name,
  category: r.category,
  price: Number(r.price),
  description: r.description,
  tags: r.tags ?? [],
  available: r.available,
  gstRate: r.gst_rate === null || r.gst_rate === undefined ? null : Number(r.gst_rate),
  hsnCode: r.hsn_code ?? null,
  businessUnitIds: r.business_unit_ids ?? [],
  imageUrl: r.image_url ?? null,
  createdAt: r.created_at,
  trackStock: r.track_stock ?? false,
  currentQty: r.current_qty !== undefined && r.current_qty !== null ? Number(r.current_qty) : 0,
  unit: r.unit ?? "unit",
  reorderPoint: r.reorder_point === null || r.reorder_point === undefined ? null : Number(r.reorder_point),
  leadTimeDays: r.lead_time_days === null || r.lead_time_days === undefined ? null : Number(r.lead_time_days),
  lastRestockedAt: r.last_restocked_at ?? null,
  branchPrice: null,
});

/** Every menu item for a tenant, stock-augmented. Pass trackedOnly to scope to items opted into Inventory. */
export async function listMenuItemsWithStock(
  tenantId: string,
  opts: { trackedOnly?: boolean } = {}
): Promise<Array<MenuItem & { branchPrice: number | null }>> {
  const rows = await query<any>(
    `SELECT * FROM menu_items WHERE tenant_id = $1 ${opts.trackedOnly ? "AND track_stock = true" : ""}
     ORDER BY category, name`,
    [tenantId]
  );
  return rows.map(mapMenuItemWithStock);
}

export async function getMenuItemStock(tenantId: string, menuItemId: string): Promise<MenuItemStock | null> {
  const row = await queryOne<any>(`SELECT * FROM menu_items WHERE tenant_id = $1 AND id = $2`, [
    tenantId,
    menuItemId,
  ]);
  if (!row) return null;
  const item = mapMenuItemWithStock(row);
  return {
    menuItemId: item.id,
    currentQty: item.currentQty,
    unit: item.unit,
    reorderPoint: item.reorderPoint,
    leadTimeDays: item.leadTimeDays,
    trackStock: item.trackStock,
    lastRestockedAt: item.lastRestockedAt,
  };
}

/** Inventory-specific per-item settings edit — name/price/tags/category stay on the Menu (Master Data) repo. */
export async function updateMenuItemStockSettings(
  tenantId: string,
  menuItemId: string,
  patch: {
    trackStock?: boolean;
    unit?: string;
    reorderPoint?: number | null;
    leadTimeDays?: number | null;
  }
): Promise<MenuItem | null> {
  const row = await queryOne(
    `UPDATE menu_items SET
       track_stock = coalesce($3, track_stock),
       unit = coalesce($4, unit),
       reorder_point = CASE WHEN $5::boolean THEN $6 ELSE reorder_point END,
       lead_time_days = CASE WHEN $7::boolean THEN $8 ELSE lead_time_days END
     WHERE tenant_id = $1 AND id = $2
     RETURNING *`,
    [
      tenantId,
      menuItemId,
      patch.trackStock ?? null,
      patch.unit ?? null,
      "reorderPoint" in patch,
      patch.reorderPoint ?? null,
      "leadTimeDays" in patch,
      patch.leadTimeDays ?? null,
    ]
  );
  return row ? mapMenuItemWithStock(row) : null;
}

/** Records a stock movement and applies it to menu_items.current_qty atomically. */
export async function recordStockAdjustment(
  tenantId: string,
  menuItemId: string,
  delta: number,
  source: "sale" | "manual" | "restock",
  reason: string
): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO stock_ledger (tenant_id, menu_item_id, delta, source, reason) VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, menuItemId, delta, source, reason]
    );
    await client.query(
      `UPDATE menu_items SET
         current_qty = current_qty + $3,
         last_restocked_at = CASE WHEN $4 = 'restock' THEN now() ELSE last_restocked_at END
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, menuItemId, delta, source]
    );
  });
}

export async function listStockLedger(
  tenantId: string,
  menuItemId?: string,
  limit = 50
): Promise<StockLedgerEntry[]> {
  const rows = await query<any>(
    `SELECT * FROM stock_ledger WHERE tenant_id = $1 AND ($2::uuid IS NULL OR menu_item_id = $2)
     ORDER BY created_at DESC LIMIT $3`,
    [tenantId, menuItemId ?? null, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    menuItemId: r.menu_item_id,
    delta: Number(r.delta),
    source: r.source,
    reason: r.reason,
    createdAt: r.created_at,
  }));
}

// ---------- reorder suggestions ----------

const mapReorderSuggestion = (r: any): ReorderSuggestion => ({
  menuItemId: r.menu_item_id,
  name: r.name,
  currentQty: Number(r.current_qty),
  avgDailySales: Number(r.avg_daily_sales),
  daysOfStockLeft: r.days_of_stock_left === null || r.days_of_stock_left === undefined ? null : Number(r.days_of_stock_left),
  suggestedOrderQty: Number(r.suggested_order_qty),
  suggestedOrderDate: r.suggested_order_date
    ? new Date(r.suggested_order_date).toISOString().slice(0, 10)
    : r.suggested_order_date,
  urgency: r.urgency,
  rationale: r.rationale ?? null,
  manualOverrideQty: r.manual_override_qty === null || r.manual_override_qty === undefined ? null : Number(r.manual_override_qty),
  computedAt: r.computed_at,
});

export async function upsertReorderSuggestions(
  tenantId: string,
  rows: Array<{
    menuItemId: string;
    currentQty: number;
    avgDailySales: number;
    daysOfStockLeft: number | null;
    suggestedOrderQty: number;
    suggestedOrderDate: string;
    urgency: "low" | "medium" | "high";
    rationale: string | null;
  }>
): Promise<void> {
  for (const r of rows) {
    await query(
      `INSERT INTO reorder_suggestions
         (tenant_id, menu_item_id, current_qty, avg_daily_sales, days_of_stock_left, suggested_order_qty, suggested_order_date, urgency, rationale, computed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
       ON CONFLICT (tenant_id, menu_item_id) DO UPDATE SET
         current_qty = EXCLUDED.current_qty,
         avg_daily_sales = EXCLUDED.avg_daily_sales,
         days_of_stock_left = EXCLUDED.days_of_stock_left,
         suggested_order_qty = EXCLUDED.suggested_order_qty,
         suggested_order_date = EXCLUDED.suggested_order_date,
         urgency = EXCLUDED.urgency,
         rationale = EXCLUDED.rationale,
         computed_at = now()`,
      [
        tenantId,
        r.menuItemId,
        r.currentQty,
        r.avgDailySales,
        r.daysOfStockLeft,
        r.suggestedOrderQty,
        r.suggestedOrderDate,
        r.urgency,
        r.rationale,
      ]
    );
  }
}

export async function listReorderSuggestions(tenantId: string): Promise<ReorderSuggestion[]> {
  const rows = await query<any>(
    `SELECT rs.*, m.name
     FROM reorder_suggestions rs
     JOIN menu_items m ON m.id = rs.menu_item_id AND m.tenant_id = rs.tenant_id
     WHERE rs.tenant_id = $1
     ORDER BY rs.days_of_stock_left ASC NULLS LAST`,
    [tenantId]
  );
  return rows.map(mapReorderSuggestion);
}

export async function setManualOverrideQty(
  tenantId: string,
  menuItemId: string,
  qty: number | null
): Promise<void> {
  await query(
    `UPDATE reorder_suggestions SET manual_override_qty = $3 WHERE tenant_id = $1 AND menu_item_id = $2`,
    [tenantId, menuItemId, qty]
  );
}

// Per-tenant secrets (AI-assist API key, WhatsApp/email credentials) live in
// their own dedicated repo — see repos-tenant-secrets.ts — since they cover
// far more than inventory now; kept out of this file to avoid the
// misleading name.
