import { computeFeaturesForTenant } from "@hpas/core";
import { listTenants } from "@hpas/db";

/** Nightly (and post-ingestion) feature recompute, every tenant. */
export async function computeFeaturesJob(): Promise<void> {
  for (const tenant of await listTenants()) {
    const { profiles } = await computeFeaturesForTenant(tenant);
    console.log(`[features] ${tenant.name}: recomputed ${profiles} profiles`);
  }
}
