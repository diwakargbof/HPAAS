// AI Pricing's deterministic core: a bounded, explainable demand-trend
// heuristic, not an econometric elasticity model — a small shop's
// transaction volume can't support one. Rising 90-day sales vs the prior
// 90 days nudges price up (capture willingness to pay); falling nudges it
// down (stimulate volume); magnitude always clamped by the tenant's
// configured max %-change and min/max price. No LLM anywhere here.

export interface ItemPricingSignal {
  menuItemId: string;
  name: string;
  currentPrice: number;
  unitsSold90d: number;
  unitsSoldPrior90d: number;
}

export interface PricingBounds {
  minPrice?: number;
  maxPrice?: number;
  maxChangePercent: number;
  /** Item's category matches an active festival window — small extra upward nudge. */
  festivalBoost?: boolean;
}

export interface PriceRecommendationResult {
  menuItemId: string;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  changePercent: number;
  demandTrend: "rising" | "falling" | "flat";
  confidence: "low" | "medium" | "high";
}

const TREND_THRESHOLD = 0.2;
const TREND_TO_PERCENT_SCALE = 25;
const FESTIVAL_BOOST_PERCENT = 5;

export function computePriceRecommendation(
  signal: ItemPricingSignal,
  bounds: PricingBounds
): PriceRecommendationResult {
  const { menuItemId, name, currentPrice, unitsSold90d, unitsSoldPrior90d } = signal;

  const trendPct =
    unitsSoldPrior90d > 0
      ? (unitsSold90d - unitsSoldPrior90d) / unitsSoldPrior90d
      : unitsSold90d > 0
        ? 1
        : 0;

  let demandTrend: "rising" | "falling" | "flat" = "flat";
  if (trendPct > TREND_THRESHOLD) demandTrend = "rising";
  else if (trendPct < -TREND_THRESHOLD) demandTrend = "falling";

  let changePercent = 0;
  if (demandTrend === "rising") {
    changePercent = Math.min(bounds.maxChangePercent, Math.abs(trendPct) * TREND_TO_PERCENT_SCALE);
  } else if (demandTrend === "falling") {
    changePercent = -Math.min(bounds.maxChangePercent, Math.abs(trendPct) * TREND_TO_PERCENT_SCALE);
  }
  if (bounds.festivalBoost && demandTrend !== "falling") {
    changePercent = Math.min(bounds.maxChangePercent, changePercent + FESTIVAL_BOOST_PERCENT);
  }

  let suggestedPrice = currentPrice * (1 + changePercent / 100);
  if (bounds.minPrice != null) suggestedPrice = Math.max(bounds.minPrice, suggestedPrice);
  if (bounds.maxPrice != null) suggestedPrice = Math.min(bounds.maxPrice, suggestedPrice);
  suggestedPrice = Math.round(suggestedPrice * 100) / 100;

  // Recompute the reported % against the clamped price, not the pre-clamp estimate.
  const finalChangePercent =
    currentPrice > 0 ? Math.round(((suggestedPrice - currentPrice) / currentPrice) * 10000) / 100 : 0;

  const dataVolume = unitsSold90d + unitsSoldPrior90d;
  const confidence: "low" | "medium" | "high" = dataVolume >= 30 ? "high" : dataVolume >= 8 ? "medium" : "low";

  return {
    menuItemId,
    name,
    currentPrice,
    suggestedPrice,
    changePercent: finalChangePercent,
    demandTrend,
    confidence,
  };
}
