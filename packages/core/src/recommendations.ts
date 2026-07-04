// Counter recommendations — the deterministic half. Given a customer's own
// history, the shop's co-purchase graph, the menu, and the festival
// calendar, rank 2-3 items the cashier should suggest RIGHT NOW. No AI
// here: candidates and ranking are pure signal math over the shop's own
// data. The (cached) AI layer only writes the cashier's pitch line on top.

import type {
  CounterRecommendation,
  Features,
  MenuItem,
  Tenant,
} from "@hpas/types";
import {
  coPurchasePairs,
  getFeaturesForProfiles,
  listMenuItems,
  purchasedItemsForProfile,
} from "@hpas/db";
import { activeFestivalWindow } from "./triggers.js";

const MS_PER_DAY = 86_400_000;

export interface RecommendationInputs {
  features: Features | null;
  purchased: Array<{ name: string; category: string; times: number; lastTs: Date }>;
  pairs: Array<{ a: string; b: string; count: number }>;
  menu: MenuItem[];
  festival: { name: string; categories: string[] } | null;
  now?: Date;
}

/** Pure ranking over pre-fetched signals (unit-testable, no I/O). */
export function rankCounterRecommendations(
  inputs: RecommendationInputs,
  limit = 3
): CounterRecommendation[] {
  const now = inputs.now ?? new Date();
  const menuByName = new Map(inputs.menu.map((m) => [m.name, m]));
  const menuActive = inputs.menu.filter((m) => m.available);
  const hasMenu = menuActive.length > 0;
  const boughtByName = new Map(inputs.purchased.map((p) => [p.name, p]));

  // When a menu exists, only recommend things the shop can actually sell today.
  const sellable = (name: string): boolean =>
    !hasMenu || (menuByName.get(name)?.available ?? false);
  const priceOf = (name: string): number | null => {
    const m = menuByName.get(name);
    return m ? m.price : null;
  };

  const candidates = new Map<string, CounterRecommendation & { score: number }>();
  const offer = (
    item: string,
    category: string,
    score: number,
    signal: string,
    reason: string
  ) => {
    if (!sellable(item)) return;
    const existing = candidates.get(item);
    if (existing) {
      // An item hit by several signals is a stronger suggestion.
      existing.score += score;
      return;
    }
    candidates.set(item, {
      item,
      category,
      price: priceOf(item),
      reason,
      signal,
      score,
    });
  };

  // Signal 1 — due for a restock: their own repeat items, past ~80% of
  // their personal cadence since last bought.
  const cadence = inputs.features?.reorderCadenceDays ?? null;
  for (const p of inputs.purchased) {
    if (p.times < 2 || !cadence) continue;
    const daysSince = Math.floor((now.getTime() - new Date(p.lastTs).getTime()) / MS_PER_DAY);
    if (daysSince >= cadence * 0.8) {
      offer(
        p.name,
        p.category,
        30 + Math.min(20, p.times * 4),
        "due_reorder",
        `Their usual — bought ${p.times} times, last ${daysSince} days ago`
      );
    }
  }

  // Signal 2 — pairs well with what they love: co-purchase graph edges from
  // their own items to things they haven't bought (or rarely buy).
  const ownItems = new Set(boughtByName.keys());
  for (const pair of inputs.pairs) {
    for (const [mine, other] of [
      [pair.a, pair.b],
      [pair.b, pair.a],
    ] as const) {
      if (!ownItems.has(mine)) continue;
      const alreadyBuys = (boughtByName.get(other)?.times ?? 0) >= 2;
      if (alreadyBuys) continue;
      const anchor = boughtByName.get(mine)!;
      offer(
        other,
        menuByName.get(other)?.category ?? "uncategorized",
        10 + Math.min(25, pair.count * 5) + Math.min(10, anchor.times * 2),
        "pairs_with",
        `Customers who buy ${mine} often take this too`
      );
    }
  }

  // Signal 3 — untried menu items in their favorite category.
  const affinity = inputs.features?.categoryAffinity;
  if (affinity && hasMenu) {
    for (const m of menuActive) {
      if (m.category !== affinity || ownItems.has(m.name)) continue;
      offer(
        m.name,
        m.category,
        12,
        "category_new",
        `New to them, in the ${affinity} they always buy`
      );
    }
  }

  // Signal 4 — festival boost: items in the active festival's categories.
  if (inputs.festival) {
    const festCats = new Set(inputs.festival.categories);
    for (const c of candidates.values()) {
      if (festCats.has(c.category)) c.score += 15;
    }
    if (hasMenu) {
      for (const m of menuActive) {
        if (festCats.has(m.category) && !ownItems.has(m.name)) {
          offer(
            m.name,
            m.category,
            14,
            "festival",
            `${inputs.festival.name} pick — festive ${m.category}`
          );
        }
      }
    }
  }

  return [...candidates.values()]
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map(({ score: _score, ...rec }) => rec);
}

/** Fetch signals and rank, for one profile. */
export async function counterRecommendationsFor(
  tenant: Tenant,
  profileId: string
): Promise<{ recommendations: CounterRecommendation[]; inputs: RecommendationInputs }> {
  const [featuresArr, purchased, pairs, menu] = await Promise.all([
    getFeaturesForProfiles(tenant.id, [profileId]),
    purchasedItemsForProfile(tenant.id, profileId),
    coPurchasePairs(tenant.id),
    listMenuItems(tenant.id),
  ]);
  const window = activeFestivalWindow(tenant, new Date());
  const festival = window
    ? {
        name: window.name,
        categories:
          tenant.config.festivals.find((f) => f.name === window.name && f.date === window.date)
            ?.categories ?? [],
      }
    : null;

  const inputs: RecommendationInputs = {
    features: featuresArr[0] ?? null,
    purchased,
    pairs,
    menu,
    festival,
  };
  return { recommendations: rankCounterRecommendations(inputs), inputs };
}
