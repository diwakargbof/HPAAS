// Public surface of @hpas/ai — four provider-agnostic functions, all
// authoring-time or cached (never in a send loop):
//   generateCampaignCopy   one template per campaign, cached on the row
//   authorSegmentFromPrompt owner's words -> segment proposal (rule = data)
//   discoverSegments       aggregate stats -> proposed segments
//   generateCounterPitch   one cashier line, cached per customer per day

import { ALL_CAMPAIGN_TYPES } from "@hpas/types";
import type {
  AuthorSegmentRequest,
  CopyProvider,
  CopyRequest,
  CopyResult,
  DiscoverSegmentsRequest,
  PitchRequest,
  PricingRationaleRequest,
  PricingRationaleResult,
  SegmentProposal,
} from "./provider.js";
import { AnthropicCopyProvider } from "./anthropic-provider.js";
import { MockCopyProvider } from "./mock-provider.js";

export type {
  AuthorSegmentRequest,
  CopyProvider,
  CopyRequest,
  CopyResult,
  DiscoverSegmentsRequest,
  PitchRequest,
  PricingRationaleRequest,
  PricingRationaleResult,
  SampleCustomer,
  SegmentContext,
  SegmentProposal,
} from "./provider.js";
export { AnthropicCopyProvider } from "./anthropic-provider.js";
export { MockCopyProvider } from "./mock-provider.js";

export function defaultProvider(): CopyProvider {
  return process.env.ANTHROPIC_API_KEY
    ? new AnthropicCopyProvider()
    : new MockCopyProvider();
}

export interface ValidatedCopy extends CopyResult {
  /** The placeholders actually used by the template. */
  variables: string[];
}

/**
 * Generate one message template for a campaign. Validates that the
 * template only uses allowed variables and actually personalizes.
 */
export async function generateCampaignCopy(
  req: CopyRequest,
  provider: CopyProvider = defaultProvider()
): Promise<ValidatedCopy> {
  const result = await provider.generateTemplate(req);

  const used = [...result.template.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]);
  const unknown = used.filter((v) => !req.availableVariables.includes(v));
  if (unknown.length > 0) {
    throw new Error(
      `template uses variables outside the allowed list: ${unknown.join(", ")}`
    );
  }

  return { ...result, variables: [...new Set(used)] };
}

/** Shared structural validation for AI-authored segment proposals. */
function validateProposal(p: SegmentProposal): SegmentProposal {
  if (!p || typeof p.name !== "string" || !p.name.trim()) {
    throw new Error("segment proposal is missing a name");
  }
  if (!ALL_CAMPAIGN_TYPES.includes(p.campaignType)) {
    throw new Error(`segment proposal has unknown campaign type "${p.campaignType}"`);
  }
  if (!p.rule || typeof p.rule !== "object" || Object.keys(p.rule).length === 0) {
    throw new Error("segment proposal has an empty rule");
  }
  return {
    name: p.name.trim().slice(0, 60),
    description: String(p.description ?? "").trim(),
    campaignType: p.campaignType,
    rule: p.rule,
  };
}

/**
 * Owner's plain language -> one segment proposal. Structural checks here;
 * the caller MUST still compile the rule with @hpas/core's whitelisted
 * compiler (and preview the audience) before saving — that's where a
 * hallucinated column dies.
 */
export async function authorSegmentFromPrompt(
  req: AuthorSegmentRequest,
  provider: CopyProvider = defaultProvider()
): Promise<SegmentProposal> {
  return validateProposal(await provider.authorSegment(req));
}

/** Aggregate stats -> up to 4 proposals; invalid ones are dropped, not fatal. */
export async function discoverSegments(
  req: DiscoverSegmentsRequest,
  provider: CopyProvider = defaultProvider()
): Promise<SegmentProposal[]> {
  const raw = await provider.discoverSegments(req);
  const valid: SegmentProposal[] = [];
  for (const p of raw) {
    try {
      valid.push(validateProposal(p));
    } catch {
      // skip malformed proposal, keep the rest
    }
  }
  return valid;
}

/** One line for the cashier. Callers cache it (counter_cards) ~24h. */
export async function generateCounterPitch(
  req: PitchRequest,
  provider: CopyProvider = defaultProvider()
): Promise<string> {
  const line = (await provider.writeCounterPitch(req)).trim().replace(/^"|"$/g, "");
  return line.slice(0, 220);
}

function fallbackPricingRationale(item: PricingRationaleRequest["items"][number]): string {
  return item.demandTrend === "rising"
    ? "Demand has been rising — a small increase captures it."
    : item.demandTrend === "falling"
      ? "Demand has cooled — a small cut may bring customers back."
      : "Demand has been steady.";
}

/**
 * One short rationale per price recommendation, one batched call for the
 * whole set. Correctness never depends on the AI call: any item the model
 * skips or a malformed reply falls back to a deterministic rationale built
 * from its demand trend.
 */
export async function generatePricingRationale(
  req: PricingRationaleRequest,
  provider: CopyProvider = defaultProvider()
): Promise<Record<string, string>> {
  const byId = new Map(req.items.map((it) => [it.menuItemId, it]));
  let results: PricingRationaleResult[] = [];
  try {
    results = await provider.writePricingRationale(req);
  } catch {
    results = [];
  }

  const rationales: Record<string, string> = {};
  for (const r of results) {
    if (byId.has(r.menuItemId) && typeof r.rationale === "string" && r.rationale.trim()) {
      rationales[r.menuItemId] = r.rationale.trim().slice(0, 200);
    }
  }
  for (const item of req.items) {
    if (!rationales[item.menuItemId]) {
      rationales[item.menuItemId] = fallbackPricingRationale(item);
    }
  }
  return rationales;
}
