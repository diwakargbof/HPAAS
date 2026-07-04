// The trigger engine. Cron-driven: evaluates every segment, applies the
// suppression layer, assigns the hold-out control, and enrolls the
// audience into a campaign in pending_approval. NOTHING is sent from
// here — sending happens only after explicit approval in the dashboard.
//
// Copy generation is injected as a callback so this package stays free of
// any AI/LLM dependency (the worker composes @hpas/core with @hpas/ai).

import crypto from "node:crypto";
import dayjs from "dayjs";
import type {
  Campaign,
  CampaignType,
  Features,
  GeneratedCopy,
  Profile,
  Segment,
  Tenant,
} from "@hpas/types";
import {
  createCampaign,
  hasOpenCampaignForSegment,
  insertMessages,
  listSegments,
  setCampaignCopy,
} from "@hpas/db";
import { audienceForSegment } from "./segments.js";
import { applySuppression } from "./suppression.js";
import { assignHoldout } from "./holdout.js";

export interface CopyGenerationContext {
  tenant: Tenant;
  segment: Segment;
  campaign: Campaign;
  /** A few representative eligible profiles (data the copywriter may use). */
  sample: Array<{ profile: Profile; features: Features }>;
}

export type CopyGenerator = (ctx: CopyGenerationContext) => Promise<GeneratedCopy>;

export interface TriggerOptions {
  /**
   * Demo/seed only: create festival campaigns even outside the pre-festival
   * window so the approval queue shows all four campaign types immediately.
   * The cron path never sets this.
   */
  ignoreFestivalWindow?: boolean;
  /** Don't recreate a campaign for a segment that had one within N days. */
  dedupeWindowDays?: number;
  /** Evaluate only this segment (e.g. "Create campaign now" from the dashboard). */
  segmentId?: string;
  generateCopy?: CopyGenerator;
  now?: Date;
}

export interface TriggerResult {
  segment: string;
  outcome: "campaign_created" | "skipped";
  reason?: string;
  campaignId?: string;
  audienceSize?: number;
  suppressedCount?: number;
  controlCount?: number;
}

const REDEMPTION_PREFIX: Record<CampaignType, string> = {
  winback: "WB",
  festival_preorder: "FE",
  new_item_alert: "NI",
  reorder_reminder: "RE",
};

function redemptionCode(tenant: Tenant, campaignType: CampaignType): string {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `${tenant.config.slug.slice(0, 4).toUpperCase()}-${REDEMPTION_PREFIX[campaignType]}-${rand}`;
}

/** Is `now` inside the pre-window of any upcoming configured festival? */
export function activeFestivalWindow(
  tenant: Tenant,
  now: Date
): { name: string; date: string } | null {
  for (const fest of tenant.config.festivals) {
    const festDate = dayjs(fest.date);
    const start = festDate.subtract(fest.preWindowDays, "day");
    if (
      (dayjs(now).isAfter(start) || dayjs(now).isSame(start, "day")) &&
      dayjs(now).isBefore(festDate.add(1, "day"), "day")
    ) {
      return { name: fest.name, date: fest.date };
    }
  }
  return null;
}

export async function evaluateTriggersForTenant(
  tenant: Tenant,
  opts: TriggerOptions = {}
): Promise<TriggerResult[]> {
  const now = opts.now ?? new Date();
  const dedupeDays = opts.dedupeWindowDays ?? 14;
  const results: TriggerResult[] = [];

  const segments = (await listSegments(tenant.id)).filter(
    (s) => !opts.segmentId || s.id === opts.segmentId
  );
  for (const segment of segments) {
    // Festival campaigns only trigger inside a configured pre-festival window.
    if (segment.campaignType === "festival_preorder" && !opts.ignoreFestivalWindow) {
      const window = activeFestivalWindow(tenant, now);
      if (!window) {
        results.push({ segment: segment.name, outcome: "skipped", reason: "no festival window active" });
        continue;
      }
    }

    if (await hasOpenCampaignForSegment(tenant.id, segment.id, dedupeDays)) {
      results.push({
        segment: segment.name,
        outcome: "skipped",
        reason: `open campaign exists within ${dedupeDays}d`,
      });
      continue;
    }

    const audience = await audienceForSegment(tenant, segment);
    if (audience.length === 0) {
      results.push({ segment: segment.name, outcome: "skipped", reason: "empty audience" });
      continue;
    }

    // MANDATORY suppression: preferences, opt-outs, frequency cap.
    const { eligible, suppressed, campaignTypeDisabled } = await applySuppression(
      tenant,
      segment.campaignType,
      audience
    );
    if (campaignTypeDisabled || eligible.length === 0) {
      results.push({
        segment: segment.name,
        outcome: "skipped",
        reason: campaignTypeDisabled
          ? "campaign type disabled in preferences"
          : "all profiles suppressed",
        suppressedCount: suppressed.length,
      });
      continue;
    }

    const campaign = await createCampaign(tenant.id, segment.id, eligible.length);

    // Hold-out control: flagged now, never sent to, tracked identically.
    const { treatment, control } = assignHoldout(eligible);
    await insertMessages([
      ...treatment.map(({ profile }) => ({
        campaignId: campaign.id,
        profileId: profile.id,
        channel: "whatsapp" as const,
        renderedText: "",
        isControl: false,
        redemptionCode: redemptionCode(tenant, segment.campaignType),
      })),
      ...control.map(({ profile }) => ({
        campaignId: campaign.id,
        profileId: profile.id,
        channel: "whatsapp" as const,
        renderedText: "",
        isControl: true,
        redemptionCode: null,
      })),
    ]);

    // One AI call per campaign (not per message) — cached on the campaign row.
    if (opts.generateCopy) {
      const sample = eligible.slice(0, 5);
      const copy = await opts.generateCopy({ tenant, segment, campaign, sample });
      await setCampaignCopy(tenant.id, campaign.id, copy);
    }

    results.push({
      segment: segment.name,
      outcome: "campaign_created",
      campaignId: campaign.id,
      audienceSize: eligible.length,
      suppressedCount: suppressed.length,
      controlCount: control.length,
    });
  }

  return results;
}
