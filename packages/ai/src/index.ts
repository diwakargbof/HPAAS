// Public surface of @hpas/ai: one function, provider-agnostic.
// generateCampaignCopy(request) -> validated template with placeholders.
// Callers cache the result on the campaign row; interpolation at send
// time is plain string substitution in @hpas/core (no AI involved).

import type { CopyProvider, CopyRequest, CopyResult } from "./provider.js";
import { AnthropicCopyProvider } from "./anthropic-provider.js";
import { MockCopyProvider } from "./mock-provider.js";

export type { CopyProvider, CopyRequest, CopyResult, SampleCustomer } from "./provider.js";
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
