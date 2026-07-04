// Menu/catalog management. The menu is what makes recommendations precise:
// counter suggestions only offer what the shop can actually sell today,
// and campaign copy can reference real new items.

import { Router } from "express";
import { importMenuFromHistory } from "@hpas/core";
import {
  deleteMenuItem,
  listMenuItems,
  setMenuItemAvailability,
  upsertMenuItem,
} from "@hpas/db";

export const menuRouter: import("express").Router = Router();

menuRouter.get("/menu", async (req, res) => {
  res.json({ items: await listMenuItems(req.tenant!.id) });
});

menuRouter.post("/menu", async (req, res) => {
  const tenant = req.tenant!;
  const { name, category, price, description, tags, available } = req.body ?? {};
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
  });
  res.json({ item });
});

menuRouter.patch("/menu/:id/availability", async (req, res) => {
  const tenant = req.tenant!;
  await setMenuItemAvailability(tenant.id, req.params.id, Boolean(req.body?.available));
  res.json({ ok: true });
});

menuRouter.delete("/menu/:id", async (req, res) => {
  await deleteMenuItem(req.tenant!.id, req.params.id);
  res.json({ ok: true });
});

/**
 * Cold-start: build the menu from what the shop has actually sold — every
 * distinct item in purchase history with its dominant category and median
 * price. Skips names already on the menu.
 */
menuRouter.post("/menu/import-from-history", async (req, res) => {
  res.json(await importMenuFromHistory(req.tenant!.id));
});
