// Loyalty: deterministic points math. Earn happens inside ingestion (every
// purchase, both CSV and streaming paths), so points can never drift from
// the events table. Balance is always the sum of an append-only ledger.

import { loyaltyConfig, type Tenant } from "@hpas/types";
import { addLoyaltyPoints, loyaltyLedgerIsEmpty, query } from "@hpas/db";

export function pointsForPurchase(tenant: Tenant, amount: number): number {
  const cfg = loyaltyConfig(tenant.config);
  if (!cfg.enabled || amount <= 0) return 0;
  return Math.floor(amount * cfg.pointsPerRupee);
}

export async function awardPurchasePoints(
  tenant: Tenant,
  profileId: string,
  amount: number
): Promise<void> {
  const points = pointsForPurchase(tenant, amount);
  if (points > 0) {
    await addLoyaltyPoints(tenant.id, profileId, points, `Purchase ₹${Math.round(amount)}`);
  }
}

/**
 * One-time backfill for tenants whose purchase history predates loyalty:
 * a single aggregate ledger entry per profile. Runs only when the ledger
 * is completely empty, so it's safe to call from every seed.
 */
export async function backfillLoyaltyFromHistory(tenant: Tenant): Promise<number> {
  const cfg = loyaltyConfig(tenant.config);
  if (!cfg.enabled) return 0;
  if (!(await loyaltyLedgerIsEmpty(tenant.id))) return 0;

  const rows = await query<{ profile_id: string }>(
    `INSERT INTO loyalty_ledger (tenant_id, profile_id, points, reason)
     SELECT tenant_id, profile_id, floor(sum(amount) * $2)::int, 'Purchase history (before loyalty launch)'
     FROM events
     WHERE tenant_id = $1 AND event_type = 'purchase'
     GROUP BY tenant_id, profile_id
     HAVING floor(sum(amount) * $2)::int > 0
     RETURNING profile_id`,
    [tenant.id, cfg.pointsPerRupee]
  );
  return rows.length;
}
