// The counter card: everything a cashier needs when a customer walks up.
// Deterministic recommendations from @hpas/core + ONE cached AI pitch line.
// Cache policy: 24h per (tenant, profile) — AI cost scales with actual
// footfall, and a shop's signals don't shift faster than the nightly
// feature recompute anyway.

import { generateCounterPitch } from "@hpas/ai";
import { counterRecommendationsFor } from "@hpas/core";
import {
  cacheCounterCard,
  getCachedCounterCard,
  getFeaturesForProfiles,
  getProfile,
  loyaltyBalance,
} from "@hpas/db";
import { loyaltyConfig, type CounterCard, type Tenant } from "@hpas/types";

const CACHE_HOURS = 24;

export async function buildCounterCard(
  tenant: Tenant,
  profileId: string,
  opts: { forceRefresh?: boolean } = {}
): Promise<CounterCard | null> {
  const profile = await getProfile(tenant.id, profileId);
  if (!profile) return null;

  const loyalty = loyaltyConfig(tenant.config);
  const balance = await loyaltyBalance(tenant.id, profileId);
  const loyaltyView = {
    balance,
    valueRupees: Math.round(balance * loyalty.pointValueRupees),
  };

  // Balance is always live; the expensive part (recommendations + pitch) is cached.
  if (!opts.forceRefresh) {
    const cached = await getCachedCounterCard(tenant.id, profileId, CACHE_HOURS);
    if (cached) return { ...cached, loyalty: loyaltyView };
  }

  const [{ recommendations, inputs }, featuresArr] = await Promise.all([
    counterRecommendationsFor(tenant, profileId),
    getFeaturesForProfiles(tenant.id, [profileId]),
  ]);
  const features = featuresArr[0] ?? null;
  const firstName =
    typeof profile.traits.name === "string" && profile.traits.name
      ? profile.traits.name.split(" ")[0]
      : null;

  const pitch = await generateCounterPitch({
    shopName: tenant.config.branding.shopName,
    brandVoice: tenant.config.brandVoice,
    customer: {
      firstName,
      favoriteItem: features?.favoriteItem ?? null,
      daysSinceLastVisit: features?.recencyDays ?? null,
      loyaltyBalance: balance,
    },
    recommendations,
    activeFestival: inputs.festival?.name ?? null,
  });

  const card: CounterCard = {
    profileId,
    name: typeof profile.traits.name === "string" ? profile.traits.name : null,
    phone: profile.phone,
    lastVisitDays: features?.recencyDays ?? null,
    favoriteItem: features?.favoriteItem ?? null,
    loyalty: loyaltyView,
    recommendations,
    pitch,
    activeFestival: inputs.festival?.name ?? null,
    computedAt: new Date().toISOString(),
  };
  await cacheCounterCard(tenant.id, profileId, card);
  return card;
}
