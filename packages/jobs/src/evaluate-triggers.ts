import { evaluateTriggersForTenant } from "@hpas/core";
import { listTenants } from "@hpas/db";
import { makeCopyGenerator } from "./copy-generator.js";

/** Daily trigger evaluation: enroll matching audiences into pending_approval campaigns. */
export async function evaluateTriggersJob(): Promise<void> {
  for (const tenant of await listTenants()) {
    const results = await evaluateTriggersForTenant(tenant, {
      generateCopy: makeCopyGenerator(),
    });
    for (const r of results) {
      console.log(
        `[triggers] ${tenant.name} / ${r.segment}: ${r.outcome}` +
          (r.outcome === "campaign_created"
            ? ` (audience=${r.audienceSize}, control=${r.controlCount}, suppressed=${r.suppressedCount})`
            : ` (${r.reason})`)
      );
    }
  }
}
