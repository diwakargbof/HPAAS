// Menu/catalog management. The menu is what makes recommendations precise:
// counter suggestions only offer what the shop can actually sell today,
// and campaign copy can reference real new items.

import { Router } from "express";
import multer from "multer";
import { importMenuFromHistory, parseCsv } from "@hpas/core";
import {
  deleteMenuItem,
  listMenuItems,
  listPriceRecommendations,
  setMenuItemAvailability,
  updateMenuItem,
  upsertMenuItem,
  upsertMenuItemBranchPrice,
} from "@hpas/db";

export const menuRouter: import("express").Router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 800 * 1024 } });

function csvField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  return [headers, ...rows].map((row) => row.map(csvField).join(",")).join("\r\n");
}

menuRouter.get("/menu", async (req, res) => {
  const businessUnitId = typeof req.query.businessUnitId === "string" ? req.query.businessUnitId : undefined;
  res.json({ items: await listMenuItems(req.tenant!.id, { businessUnitId }) });
});

/** Pricing > Master Data > Download: every menu item plus its current price recommendation, if any. */
menuRouter.get("/menu/export.csv", async (req, res) => {
  const tenant = req.tenant!;
  const [items, recommendations] = await Promise.all([
    listMenuItems(tenant.id),
    listPriceRecommendations(tenant.id),
  ]);
  const recByItemId = new Map(recommendations.map((r) => [r.menuItemId, r]));
  const csv = toCsv(
    ["name", "category", "price", "gstRate", "hsnCode", "available", "businessUnitIds", "suggestedPrice", "demandTrend", "confidence"],
    items.map((item) => {
      const rec = recByItemId.get(item.id);
      return [
        item.name,
        item.category,
        item.price,
        item.gstRate ?? "",
        item.hsnCode ?? "",
        item.available,
        item.businessUnitIds.join(";"),
        rec?.suggestedPrice ?? "",
        rec?.demandTrend ?? "",
        rec?.confidence ?? "",
      ];
    })
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="menu.csv"`);
  res.send(csv);
});

/** Pricing > Master Data > Upload: bulk create/update menu items from a CSV. */
menuRouter.post("/menu/import", upload.single("file"), async (req, res) => {
  const tenant = req.tenant!;
  if (!req.file) {
    res.status(400).json({ error: "file is required" });
    return;
  }
  const rows = parseCsv(req.file.buffer.toString("utf-8"));
  const errors: Array<{ rowNumber: number; reason: string }> = [];
  let processed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row.name ?? "").trim();
    if (!name) {
      errors.push({ rowNumber: i + 2, reason: "missing name" });
      continue;
    }
    const price = Number(row.price);
    if (Number.isNaN(price)) {
      errors.push({ rowNumber: i + 2, reason: `invalid price: "${row.price ?? ""}"` });
      continue;
    }
    await upsertMenuItem(tenant.id, {
      name,
      category: String(row.category ?? "uncategorized").trim() || "uncategorized",
      price: Math.max(0, price),
      gstRate: row.gstRate && !Number.isNaN(Number(row.gstRate)) ? Math.max(0, Math.min(28, Number(row.gstRate))) : null,
      hsnCode: row.hsnCode?.trim() || null,
      available: String(row.available ?? "true").toLowerCase() !== "false",
      businessUnitIds: row.businessUnitIds
        ? row.businessUnitIds.split(";").map((s) => s.trim()).filter(Boolean)
        : [],
    });
    processed++;
  }
  res.json({ rowsProcessed: processed, errors });
});

menuRouter.post("/menu", async (req, res) => {
  const tenant = req.tenant!;
  const { name, category, price, description, tags, available, gstRate, hsnCode, businessUnitIds } = req.body ?? {};
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const item = await upsertMenuItem(tenant.id, {
    name: name.trim(),
    category: String(category ?? "uncategorized").trim() || "uncategorized",
    price: Math.max(0, Number(price) || 0),
    description: typeof description === "string" ? description : null,
    tags: Array.isArray(tags) ? tags.map(String) : [],
    available: available !== false,
    gstRate: gstRate !== null && gstRate !== undefined && gstRate !== "" ? Math.max(0, Math.min(28, Number(gstRate))) : null,
    hsnCode: typeof hsnCode === "string" && hsnCode.trim() ? hsnCode.trim() : null,
    businessUnitIds: Array.isArray(businessUnitIds) ? businessUnitIds.map(String) : [],
  });
  res.json({ item });
});

menuRouter.patch("/menu/:id/availability", async (req, res) => {
  const tenant = req.tenant!;
  await setMenuItemAvailability(tenant.id, req.params.id, Boolean(req.body?.available));
  res.json({ ok: true });
});

/** General edit — used for inline price/category/GST/business-unit changes on Master Data. */
menuRouter.patch("/menu/:id", async (req, res) => {
  const tenant = req.tenant!;
  const { name, category, price, gstRate, hsnCode, businessUnitIds } = req.body ?? {};
  const patch: Parameters<typeof updateMenuItem>[2] = {};
  if (typeof name === "string" && name.trim()) patch.name = name.trim();
  if (typeof category === "string" && category.trim()) patch.category = category.trim();
  if (price !== undefined && price !== null && price !== "" && !Number.isNaN(Number(price))) {
    patch.price = Math.max(0, Number(price));
  }
  if ("gstRate" in (req.body ?? {})) {
    patch.gstRate = gstRate !== null && gstRate !== undefined && gstRate !== "" ? Math.max(0, Math.min(28, Number(gstRate))) : null;
  }
  if ("hsnCode" in (req.body ?? {})) {
    patch.hsnCode = typeof hsnCode === "string" && hsnCode.trim() ? hsnCode.trim() : null;
  }
  if (Array.isArray(businessUnitIds)) patch.businessUnitIds = businessUnitIds.map(String);

  const item = await updateMenuItem(tenant.id, req.params.id, patch);
  if (!item) {
    res.status(404).json({ error: "item not found" });
    return;
  }
  res.json({ item });
});

menuRouter.delete("/menu/:id", async (req, res) => {
  await deleteMenuItem(req.tenant!.id, req.params.id);
  res.json({ ok: true });
});

/** Item photo — stored as a data URI (small shop catalogs, no object storage needed). */
menuRouter.post("/menu/:id/image", imageUpload.single("file"), async (req, res) => {
  const tenant = req.tenant!;
  if (!req.file) {
    res.status(400).json({ error: "file is required" });
    return;
  }
  if (!req.file.mimetype.startsWith("image/")) {
    res.status(400).json({ error: "file must be an image" });
    return;
  }
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const item = await updateMenuItem(tenant.id, req.params.id, { imageUrl: dataUri });
  if (!item) {
    res.status(404).json({ error: "item not found" });
    return;
  }
  res.json({ item });
});

/** Branch price override — set/clear one business unit's price for one item. */
menuRouter.put("/menu/:id/branch-price", async (req, res) => {
  const tenant = req.tenant!;
  const businessUnitId = String(req.body?.businessUnitId ?? "").trim();
  if (!businessUnitId) {
    res.status(400).json({ error: "businessUnitId is required" });
    return;
  }
  const priceBody = req.body?.price;
  const price = priceBody === null || priceBody === undefined || priceBody === "" ? null : Math.max(0, Number(priceBody));
  await upsertMenuItemBranchPrice(tenant.id, req.params.id, businessUnitId, price);
  res.json({ ok: true });
});

menuRouter.delete("/menu/:id/image", async (req, res) => {
  const item = await updateMenuItem(req.tenant!.id, req.params.id, { imageUrl: null });
  if (!item) {
    res.status(404).json({ error: "item not found" });
    return;
  }
  res.json({ item });
});

/**
 * Cold-start: build the menu from what the shop has actually sold — every
 * distinct item in purchase history with its dominant category and median
 * price. Skips names already on the menu.
 */
menuRouter.post("/menu/import-from-history", async (req, res) => {
  res.json(await importMenuFromHistory(req.tenant!.id));
});
