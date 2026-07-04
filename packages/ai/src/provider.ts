// The provider interface. Everything outside this package sees only
// CopyRequest -> CopyResult. Which LLM (or mock) fulfills it is an
// implementation detail — swapping providers touches zero callers.

import type { BrandVoice, CampaignType, SegmentRule } from "@hpas/types";

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
}

export interface CopyResult {
  /** One WhatsApp-length message with {{variable}} placeholders. */
  template: string;
  provider: string;
  model: string;
}

export interface CopyProvider {
  readonly name: string;
  generateTemplate(req: CopyRequest): Promise<CopyResult>;
}
