// RFM + affinity feature computation. Runs in the worker (nightly + after
// ingestion), writes the precomputed `features` table. Segmentation only
// ever reads that table — never these functions at query time.

import dayjs from "dayjs";
import type { EventItem, EventRow, Features, Tenant } from "@hpas/types";
import { listProfileIds, purchaseEventsByProfile, upsertFeatures } from "@hpas/db";

const MS_PER_DAY = 86_400_000;

/** Pure computation for one profile's purchase history (unit-testable). */
export function computeProfileFeatures(
  tenant: Tenant,
  profileId: string,
  purchases: EventRow[], // sorted ascending by ts
  now: Date
): Omit<Features, "computedAt"> {
  const last = purchases[purchases.length - 1];
  const recencyDays = last
    ? Math.floor((now.getTime() - last.ts.getTime()) / MS_PER_DAY)
    : 9999;

  const ninetyDaysAgo = now.getTime() - 90 * MS_PER_DAY;
  const frequency90d = purchases.filter((p) => p.ts.getTime() >= ninetyDaysAgo).length;

  const monetaryLtv = purchases.reduce((sum, p) => sum + p.amount, 0);

  // Category affinity: category with the highest total spend.
  const spendByCategory = new Map<string, number>();
  const qtyByItem = new Map<string, number>();
  for (const p of purchases) {
    for (const item of p.items) {
      spendByCategory.set(
        item.category,
        (spendByCategory.get(item.category) ?? 0) + item.qty * item.unitPrice
      );
      qtyByItem.set(item.name, (qtyByItem.get(item.name) ?? 0) + item.qty);
    }
  }
  const categoryAffinity = maxKey(spendByCategory);
  const favoriteItem = maxKey(qtyByItem);

  // Festival buyer: any purchase inside a configured festival window
  // (preWindowDays before → 1 day after the festival date). Past festival
  // entries in the config exist precisely so this can look at history.
  let festivalBuyer = false;
  let lastFestivalBasket: EventItem[] | null = null;
  let lastFestivalTs = 0;
  for (const fest of tenant.config.festivals) {
    const festDate = dayjs(fest.date);
    const windowStart = festDate.subtract(fest.preWindowDays, "day").valueOf();
    const windowEnd = festDate.add(1, "day").endOf("day").valueOf();
    for (const p of purchases) {
      const t = p.ts.getTime();
      if (t >= windowStart && t <= windowEnd) {
        festivalBuyer = true;
        if (t > lastFestivalTs) {
          lastFestivalTs = t;
          lastFestivalBasket = p.items;
        }
      }
    }
  }

  // Reorder cadence: median gap between consecutive purchases (needs >= 3).
  let reorderCadenceDays: number | null = null;
  if (purchases.length >= 3) {
    const gaps: number[] = [];
    for (let i = 1; i < purchases.length; i++) {
      gaps.push((purchases[i].ts.getTime() - purchases[i - 1].ts.getTime()) / MS_PER_DAY);
    }
    gaps.sort((a, b) => a - b);
    const mid = Math.floor(gaps.length / 2);
    const median = gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
    reorderCadenceDays = Math.max(1, Math.round(median));
  }

  return {
    profileId,
    tenantId: tenant.id,
    recencyDays,
    frequency90d,
    monetaryLtv: Math.round(monetaryLtv * 100) / 100,
    categoryAffinity,
    festivalBuyer,
    lastFestivalBasket,
    reorderCadenceDays,
    favoriteItem,
  };
}

function maxKey(m: Map<string, number>): string | null {
  let best: string | null = null;
  let bestVal = -Infinity;
  for (const [k, v] of m) {
    if (v > bestVal) {
      best = k;
      bestVal = v;
    }
  }
  return best;
}

/** Recompute and persist features for every profile of a tenant. */
export async function computeFeaturesForTenant(
  tenant: Tenant,
  now = new Date()
): Promise<{ profiles: number }> {
  const byProfile = await purchaseEventsByProfile(tenant.id);
  const allProfileIds = await listProfileIds(tenant.id);
  for (const profileId of allProfileIds) {
    const purchases = byProfile.get(profileId) ?? [];
    await upsertFeatures(computeProfileFeatures(tenant, profileId, purchases, now));
  }
  return { profiles: allProfileIds.length };
}
