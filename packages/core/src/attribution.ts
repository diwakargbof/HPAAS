// Attribution: messaged vs hold-out control, per campaign. This is the
// number that proves the pilot worked — incremental repeat-purchase rate
// and incremental revenue per customer, plus hard redemptions via the
// per-message codes. Deterministic SQL + arithmetic; no AI anywhere.

import type { AttributionReport, Campaign, Tenant } from "@hpas/types";
import {
  countRedemptionsForCampaign,
  getCampaign,
  messagesForCampaign,
  purchasesSince,
} from "@hpas/db";

export async function computeAttribution(
  tenant: Tenant,
  campaignId: string
): Promise<AttributionReport | null> {
  const campaign = await getCampaign(tenant.id, campaignId);
  if (!campaign || campaign.status !== "sent") return null;

  const messages = await messagesForCampaign(campaign.id);
  const since = sendTimestamp(campaign, messages);
  if (!since) return null;

  const treatmentIds = messages
    .filter((m) => !m.isControl && m.status !== "failed")
    .map((m) => m.profileId);
  const controlIds = messages.filter((m) => m.isControl).map((m) => m.profileId);

  const [treatmentPurchases, controlPurchases, redemptions] = await Promise.all([
    purchasesSince(tenant.id, treatmentIds, since),
    purchasesSince(tenant.id, controlIds, since),
    countRedemptionsForCampaign(campaign.id),
  ]);

  const stats = (ids: string[], purchases: Map<string, { count: number; revenue: number }>) => {
    if (ids.length === 0) return { repeatRate: 0, revenuePerCustomer: 0 };
    const repeaters = ids.filter((id) => (purchases.get(id)?.count ?? 0) > 0).length;
    const revenue = ids.reduce((sum, id) => sum + (purchases.get(id)?.revenue ?? 0), 0);
    return { repeatRate: repeaters / ids.length, revenuePerCustomer: revenue / ids.length };
  };

  const treatment = stats(treatmentIds, treatmentPurchases);
  const control = stats(controlIds, controlPurchases);

  const round = (n: number) => Math.round(n * 10000) / 10000;
  return {
    campaignId: campaign.id,
    messagedCount: treatmentIds.length,
    controlCount: controlIds.length,
    messagedRepeatRate: round(treatment.repeatRate),
    controlRepeatRate: round(control.repeatRate),
    incrementalRepeatRate: round(treatment.repeatRate - control.repeatRate),
    messagedRevenuePerCustomer: round(treatment.revenuePerCustomer),
    controlRevenuePerCustomer: round(control.revenuePerCustomer),
    incrementalRevenuePerCustomer: round(
      treatment.revenuePerCustomer - control.revenuePerCustomer
    ),
    redemptions,
    computedAt: new Date().toISOString(),
  };
}

function sendTimestamp(
  campaign: Campaign,
  messages: Array<{ sentAt: Date | null }>
): Date | null {
  const sentTimes = messages
    .map((m) => m.sentAt?.getTime())
    .filter((t): t is number => typeof t === "number");
  if (sentTimes.length > 0) return new Date(Math.min(...sentTimes));
  return campaign.approvedAt ?? null;
}
