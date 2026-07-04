// Menu cold-start: build the catalog from what the shop has actually sold.
// Used by the dashboard's "Import from sales history" button and by the
// seed, so a tenant's counter recommendations work on day one.

import { listMenuItems, menuCandidatesFromHistory, upsertMenuItem } from "@hpas/db";

export async function importMenuFromHistory(
  tenantId: string
): Promise<{ imported: number; skipped: number }> {
  const [candidates, existing] = await Promise.all([
    menuCandidatesFromHistory(tenantId),
    listMenuItems(tenantId),
  ]);
  const existingNames = new Set(existing.map((m) => m.name));
  let imported = 0;
  for (const c of candidates) {
    if (existingNames.has(c.name)) continue;
    await upsertMenuItem(tenantId, {
      name: c.name,
      category: c.category,
      price: c.price,
      description: null,
      tags: [],
      available: true,
    });
    imported++;
  }
  return { imported, skipped: candidates.length - imported };
}
