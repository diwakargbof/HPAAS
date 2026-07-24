// Inventory: an optional, admin-gated add-on (tenant.config.modules.inventory
// — same "turned on outside the app" gating as Pricing). Stock lives on the
// existing menu_items catalog (no separate item list), but this router is
// also a full editor for that catalog's own fields (name/category/price/
// tags) so a tenant never has to leave Inventory to make a full edit — see
// Master Data /menu for the same data from Personalization/Pricing's side.
// Also handles the stock-specific fields (track_stock, unit, reorder_point,
// lead_time_days, current_qty) plus the cached reorder_suggestions the
// predict-inventory job computes. See KNOWLEDGE_GRAPH.md for deliberate
// scope limits.

import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { parseCsv } from "@hpas/core";
import { refreshReorderSuggestions } from "@hpas/jobs";
import {
  getMenuItemStock,
  listMenuItemsWithStock,
  listReorderSuggestions,
  listStockLedger,
  patchTenantConfig,
  recordStockAdjustment,
  setManualOverrideQty,
  updateMenuItem,
  updateMenuItemStockSettings,
  upsertMenuItem,
} from "@hpas/db";
import { inventoryConfig, inventoryDashboardConfig, type InventoryWidget, type InventoryWidgetType } from "@hpas/types";

export const inventoryRouter: import("express").Router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * Parses a stock-count file into plain row records, regardless of format —
 * the tenant can upload whatever they already have (CSV/TSV export from a
 * POS or spreadsheet, a raw JSON array, or an actual .xlsx/.xls workbook)
 * instead of having to convert to CSV first. Detected by file extension.
 */
function parseInventoryFile(buffer: Buffer, filename: string): Array<Record<string, string>> {
  const ext = (filename.split(".").pop() ?? "").toLowerCase();

  if (ext === "xlsx" || ext === "xls") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    return rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v)])));
  }

  if (ext === "json") {
    const parsed = JSON.parse(buffer.toString("utf-8"));
    if (!Array.isArray(parsed)) throw new Error("JSON file must contain an array of row objects");
    return parsed.map((row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v)])));
  }

  if (ext === "tsv") {
    const lines = buffer.toString("utf-8").split(/\r\n|\n/).filter((l) => l.length > 0);
    if (lines.length === 0) return [];
    const headers = lines[0].split("\t").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const cells = line.split("\t");
      return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
    });
  }

  // Default: CSV (also covers .txt).
  return parseCsv(buffer.toString("utf-8"));
}

const INVENTORY_WIDGET_TYPES: InventoryWidgetType[] = [
  "low_stock_alerts",
  "days_of_stock_leaderboard",
  "reorder_queue",
  "recent_adjustments",
  "top_movers",
];

function csvField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  return [headers, ...rows].map((row) => row.map(csvField).join(",")).join("\r\n");
}

inventoryRouter.use((req, res, next) => {
  if (!req.tenant!.config.modules.inventory?.enabled) {
    res.status(403).json({ error: "Inventory is not enabled for this account" });
    return;
  }
  next();
});

// ---------- settings ----------

inventoryRouter.get("/settings/inventory", (req, res) => {
  res.json({ inventory: inventoryConfig(req.tenant!.config) });
});

inventoryRouter.put("/settings/inventory", async (req, res) => {
  const tenant = req.tenant!;
  const current = inventoryConfig(tenant.config);
  const body = req.body?.inventory ?? {};

  const patch = {
    inventory: {
      defaultLeadTimeDays: Math.max(0, Math.min(90, Number(body.defaultLeadTimeDays ?? current.defaultLeadTimeDays))),
      defaultSafetyStockDays: Math.max(0, Math.min(90, Number(body.defaultSafetyStockDays ?? current.defaultSafetyStockDays))),
      lowStockThresholdDays: Math.max(0, Math.min(90, Number(body.lowStockThresholdDays ?? current.lowStockThresholdDays))),
      autoDecrementFromSales: Boolean(body.autoDecrementFromSales ?? current.autoDecrementFromSales),
    },
  };

  await patchTenantConfig(tenant.id, patch);
  res.json({ ok: true });
});

// ---------- inventory dashboard (configurable widgets) ----------
// Same pattern as /settings/pricing-dashboard: no new data queries, every
// widget renders client-side from the endpoints below.

inventoryRouter.get("/settings/inventory-dashboard", (req, res) => {
  res.json({ dashboard: inventoryDashboardConfig(req.tenant!.config) });
});

inventoryRouter.put("/settings/inventory-dashboard", async (req, res) => {
  const tenant = req.tenant!;
  const widgetsBody = Array.isArray(req.body?.dashboard?.widgets) ? req.body.dashboard.widgets : [];

  const widgets: InventoryWidget[] = widgetsBody
    .filter((w: Partial<InventoryWidget>) => INVENTORY_WIDGET_TYPES.includes(w.type as InventoryWidgetType))
    .map((w: Partial<InventoryWidget>) => ({
      id: String(w.id ?? "").trim() || `widget-${Math.random().toString(36).slice(2, 10)}`,
      type: w.type as InventoryWidgetType,
      ...(w.title ? { title: String(w.title).slice(0, 60) } : {}),
    }));

  await patchTenantConfig(tenant.id, { inventoryDashboard: { widgets } });
  res.json({ dashboard: { widgets } });
});

// ---------- items ----------

inventoryRouter.get("/inventory/items", async (req, res) => {
  res.json({ items: await listMenuItemsWithStock(req.tenant!.id) });
});

/** Add a brand-new item straight from Inventory — no trip to Master Data required. Track-stock defaults on. */
inventoryRouter.post("/inventory/items", async (req, res) => {
  const tenant = req.tenant!;
  const body = req.body ?? {};
  const name = String(body.name ?? "").trim();
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const item = await upsertMenuItem(tenant.id, {
    name,
    category: String(body.category ?? "uncategorized").trim() || "uncategorized",
    price: Math.max(0, Number(body.price) || 0),
    tags: Array.isArray(body.tags) ? body.tags.map(String).slice(0, 10) : [],
  });

  await updateMenuItemStockSettings(tenant.id, item.id, {
    trackStock: true,
    unit: String(body.unit ?? "unit").trim().slice(0, 20) || "unit",
    reorderPoint: body.reorderPoint !== undefined && body.reorderPoint !== null ? Math.max(0, Number(body.reorderPoint)) : null,
    leadTimeDays: body.leadTimeDays !== undefined && body.leadTimeDays !== null ? Math.max(0, Math.round(Number(body.leadTimeDays))) : null,
  });

  const initialQty = Math.max(0, Number(body.initialQty) || 0);
  if (initialQty > 0) {
    await recordStockAdjustment(tenant.id, item.id, initialQty, "restock", "Initial stock (new item)");
  }

  res.json({ item: await getMenuItemStock(tenant.id, item.id) });
});

/**
 * The one editor for everything on an inventory item — catalog fields
 * (name/category/price/tags, same underlying columns Master Data edits)
 * AND stock fields (track-stock/unit/reorder point/lead time), so nothing
 * requires leaving Inventory for a full edit.
 */
inventoryRouter.patch("/inventory/items/:id", async (req, res) => {
  const tenant = req.tenant!;
  const body = req.body ?? {};

  const catalogPatch: Parameters<typeof updateMenuItem>[2] = {};
  if (typeof body.name === "string" && body.name.trim()) catalogPatch.name = body.name.trim();
  if (typeof body.category === "string" && body.category.trim()) catalogPatch.category = body.category.trim();
  if ("price" in body) catalogPatch.price = Math.max(0, Number(body.price) || 0);
  if (Array.isArray(body.tags)) catalogPatch.tags = body.tags.map(String).slice(0, 10);
  if (Object.keys(catalogPatch).length > 0) {
    const updated = await updateMenuItem(tenant.id, req.params.id, catalogPatch);
    if (!updated) {
      res.status(404).json({ error: "item not found" });
      return;
    }
  }

  const stockPatch: Parameters<typeof updateMenuItemStockSettings>[2] = {};
  if (typeof body.trackStock === "boolean") stockPatch.trackStock = body.trackStock;
  if (typeof body.unit === "string" && body.unit.trim()) stockPatch.unit = body.unit.trim().slice(0, 20);
  if ("reorderPoint" in body) stockPatch.reorderPoint = body.reorderPoint === null ? null : Math.max(0, Number(body.reorderPoint));
  if ("leadTimeDays" in body) stockPatch.leadTimeDays = body.leadTimeDays === null ? null : Math.max(0, Math.round(Number(body.leadTimeDays)));

  const item =
    Object.keys(stockPatch).length > 0
      ? await updateMenuItemStockSettings(tenant.id, req.params.id, stockPatch)
      : await getMenuItemStock(tenant.id, req.params.id);
  if (!item) {
    res.status(404).json({ error: "item not found" });
    return;
  }
  res.json({ item });
});

/** Manual stock override by delta — e.g. "-3" for a shrinkage correction. */
inventoryRouter.post("/inventory/items/:id/adjust", async (req, res) => {
  const tenant = req.tenant!;
  const delta = Number(req.body?.delta);
  const reason = String(req.body?.reason ?? "").trim().slice(0, 200) || "Manual adjustment";
  if (!Number.isFinite(delta) || delta === 0) {
    res.status(400).json({ error: "delta must be a non-zero number" });
    return;
  }
  await recordStockAdjustment(tenant.id, req.params.id, delta, "manual", reason);
  res.json({ ok: true });
});

/**
 * Manual stock override by absolute value — typing in "42" instead of
 * clicking +/- forty-two times. Delta is computed server-side against the
 * freshest current_qty to avoid a stale-client race.
 */
inventoryRouter.post("/inventory/items/:id/set-quantity", async (req, res) => {
  const tenant = req.tenant!;
  const qty = Number(req.body?.qty);
  const reason = String(req.body?.reason ?? "").trim().slice(0, 200) || "Manual quantity edit";
  if (!Number.isFinite(qty) || qty < 0) {
    res.status(400).json({ error: "qty must be a non-negative number" });
    return;
  }
  const current = await getMenuItemStock(tenant.id, req.params.id);
  if (!current) {
    res.status(404).json({ error: "item not found" });
    return;
  }
  const delta = qty - current.currentQty;
  if (delta !== 0) {
    await recordStockAdjustment(tenant.id, req.params.id, delta, "manual", reason);
  }
  res.json({ item: await getMenuItemStock(tenant.id, req.params.id) });
});

/** Restock — same ledger, marks last_restocked_at. */
inventoryRouter.post("/inventory/items/:id/restock", async (req, res) => {
  const tenant = req.tenant!;
  const qty = Number(req.body?.qty);
  const reason = String(req.body?.reason ?? "").trim().slice(0, 200) || "Restock";
  if (!Number.isFinite(qty) || qty <= 0) {
    res.status(400).json({ error: "qty must be a positive number" });
    return;
  }
  await recordStockAdjustment(tenant.id, req.params.id, qty, "restock", reason);
  res.json({ ok: true });
});

inventoryRouter.get("/inventory/items/:id/ledger", async (req, res) => {
  res.json({ ledger: await listStockLedger(req.tenant!.id, req.params.id) });
});

/** Tenant-wide recent stock movements — powers the "Recent Adjustments" dashboard widget. */
inventoryRouter.get("/inventory/ledger", async (req, res) => {
  res.json({ ledger: await listStockLedger(req.tenant!.id, undefined, 30) });
});

/** Bulk stock-count export — a periodic physical count workflow, also usable as an import template. */
inventoryRouter.get("/inventory/items/export.csv", async (req, res) => {
  const items = await listMenuItemsWithStock(req.tenant!.id, { trackedOnly: true });
  const csv = toCsv(
    ["name", "category", "price", "unit", "currentQty", "reorderPoint", "leadTimeDays", "tags"],
    items.map((item) => [
      item.name,
      item.category,
      item.price,
      item.unit,
      item.currentQty,
      item.reorderPoint ?? "",
      item.leadTimeDays ?? "",
      item.tags.join(";"),
    ])
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="inventory-stock-count.csv"`);
  res.send(csv);
});

/**
 * Bulk import from whatever file the tenant already has — CSV, TSV, JSON,
 * or an actual Excel workbook (.xlsx/.xls), auto-detected by extension (see
 * parseInventoryFile). Rows are matched to existing items by name; a name
 * with no match is CREATED as a new tracked item (category/price optional,
 * default to "uncategorized"/0) rather than rejected, so this doubles as a
 * "add my whole inventory in one upload" flow, not just a recount tool.
 */
inventoryRouter.post("/inventory/items/import", upload.single("file"), async (req, res) => {
  const tenant = req.tenant!;
  if (!req.file) {
    res.status(400).json({ error: "file is required" });
    return;
  }

  let rows: Array<Record<string, string>>;
  try {
    rows = parseInventoryFile(req.file.buffer, req.file.originalname ?? "upload.csv");
  } catch (err) {
    res.status(400).json({ error: `couldn't read that file: ${err instanceof Error ? err.message : err}` });
    return;
  }

  const items = await listMenuItemsWithStock(tenant.id);
  const byName = new Map(items.map((item) => [item.name.toLowerCase(), item]));

  const errors: Array<{ rowNumber: number; reason: string }> = [];
  let processed = 0;
  let created = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row.name ?? "").trim();
    if (!name) {
      errors.push({ rowNumber: i + 2, reason: "missing name" });
      continue;
    }

    let item = byName.get(name.toLowerCase());
    if (!item) {
      const newItem = await upsertMenuItem(tenant.id, {
        name,
        category: String(row.category ?? "uncategorized").trim() || "uncategorized",
        price: Number(row.price) || 0,
        tags: row.tags ? row.tags.split(";").map((t) => t.trim()).filter(Boolean) : [],
      });
      await updateMenuItemStockSettings(tenant.id, newItem.id, { trackStock: true });
      const stock = await getMenuItemStock(tenant.id, newItem.id);
      if (!stock) continue;
      item = { ...newItem, ...stock, branchPrice: null };
      byName.set(name.toLowerCase(), item);
      created++;
    }

    if ("currentQty" in row && row.currentQty !== "") {
      const countedQty = Number(row.currentQty);
      if (Number.isNaN(countedQty)) {
        errors.push({ rowNumber: i + 2, reason: `invalid currentQty: "${row.currentQty}"` });
        continue;
      }
      const delta = countedQty - item.currentQty;
      if (delta !== 0) {
        await recordStockAdjustment(tenant.id, item.id, delta, "manual", "Bulk file import");
        item.currentQty = countedQty;
      }
    }

    const settingsPatch: Parameters<typeof updateMenuItemStockSettings>[2] = {};
    if (row.unit?.trim()) settingsPatch.unit = row.unit.trim().slice(0, 20);
    if (row.reorderPoint !== undefined && row.reorderPoint !== "") settingsPatch.reorderPoint = Math.max(0, Number(row.reorderPoint) || 0);
    if (row.leadTimeDays !== undefined && row.leadTimeDays !== "") settingsPatch.leadTimeDays = Math.max(0, Math.round(Number(row.leadTimeDays) || 0));
    if (Object.keys(settingsPatch).length > 0) {
      await updateMenuItemStockSettings(tenant.id, item.id, settingsPatch);
    }

    processed++;
  }
  res.json({ rowsProcessed: processed, itemsCreated: created, errors });
});

// ---------- reorder suggestions ----------

inventoryRouter.get("/inventory/reorder-suggestions", async (req, res) => {
  res.json({ suggestions: await listReorderSuggestions(req.tenant!.id) });
});

inventoryRouter.post("/inventory/reorder-suggestions/recompute", async (req, res) => {
  const suggestions = await refreshReorderSuggestions(req.tenant!);
  res.json({ suggestions });
});

inventoryRouter.put("/inventory/reorder-suggestions/:menuItemId/override", async (req, res) => {
  const tenant = req.tenant!;
  const qty = req.body?.qty === null ? null : Number(req.body?.qty);
  if (qty !== null && (!Number.isFinite(qty) || qty < 0)) {
    res.status(400).json({ error: "qty must be a non-negative number or null" });
    return;
  }
  await setManualOverrideQty(tenant.id, req.params.menuItemId, qty);
  res.json({ ok: true });
});
