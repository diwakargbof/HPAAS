// The provider interface — the ONLY seam through which HPAS talks to an
// LLM. Four narrow, authoring-time/cached capabilities: campaign copy,
// segment authoring from natural language, segment discovery from
// aggregate stats, and the counter pitch line. Which LLM (or mock)
// fulfills them is an implementation detail — swapping providers touches
// zero callers, and the deterministic engine never depends on any of it.

import type { BrandVoice, CampaignType, CounterRecommendation, SegmentRule } from "@hpas/types";

/** A representative (small!) sample of the audience — data, not PII dumps. */
export interface SampleCustomer {
  firstName: string | null;
  favoriteItem: string | null;
  categoryAffinity: string | null;
  daysSinceLastVisit: number;
}

export interface CopyRequest {
  shopName: string;
  brandVoice: BrandVoice;
  campaignType: CampaignType;
  segmentName: string;
  segmentRule: SegmentRule;
  /** Placeholders the template may use, e.g. ["name", "favorite_item"] */
  availableVariables: string[];
  sampleCustomers: SampleCustomer[];
  /** For festival campaigns: which festival this targets. */
  festival?: { name: string; date: string; categories: string[] };
  /** Recently added menu items — lets new-item alerts name real products. */
  newItems?: Array<{ name: string; category: string; price: number }>;
}

export interface CopyResult {
  /** One WhatsApp-length message with {{variable}} placeholders. */
  template: string;
  provider: string;
  model: string;
}

// ---------- segment authoring & discovery ----------

/** Tenant context the segment AI needs — aggregates and vocabulary, no PII. */
export interface SegmentContext {
  shopName: string;
  /** Item categories this shop actually sells (rule vocabulary). */
  categories: string[];
  /** LTV quartiles [p25, p50, p75, p90] so "big spenders" maps to real numbers. */
  ltvQuartiles: number[];
  totalProfiles: number;
}

export interface AuthorSegmentRequest {
  /** What the shop owner typed, e.g. "gift box buyers who skipped this Diwali". */
  prompt: string;
  context: SegmentContext;
}

export interface SegmentProposal {
  name: string;
  /** Plain-English meaning, shown to the owner. */
  description: string;
  campaignType: CampaignType;
  rule: SegmentRule;
}

export interface DiscoverSegmentsRequest {
  context: SegmentContext;
  /** Aggregate distribution snapshot (recency buckets, category spend, etc). */
  stats: {
    recencyBuckets: Record<string, number>;
    categorySpend: Array<{ category: string; revenue: number; buyers: number }>;
    festivalBuyers: number;
    withCadence: number;
  };
  /** Segments that already exist, so proposals don't duplicate them. */
  existingSegmentNames: string[];
}

// ---------- counter pitch ----------

export interface PitchRequest {
  shopName: string;
  brandVoice: BrandVoice;
  customer: {
    firstName: string | null;
    favoriteItem: string | null;
    daysSinceLastVisit: number | null;
    loyaltyBalance: number;
  };
  recommendations: CounterRecommendation[];
  activeFestival: string | null;
}

export interface CopyProvider {
  readonly name: string;
  generateTemplate(req: CopyRequest): Promise<CopyResult>;
  /** Natural language -> one segment proposal (rule validated by the caller). */
  authorSegment(req: AuthorSegmentRequest): Promise<SegmentProposal>;
  /** Aggregate stats -> up to 4 interesting segment proposals. */
  discoverSegments(req: DiscoverSegmentsRequest): Promise<SegmentProposal[]>;
  /** One line the cashier can say out loud, in the shop's voice. */
  writeCounterPitch(req: PitchRequest): Promise<string>;
}
