// Sends an APPROVED campaign: renders each queued message from the cached
// template (plain interpolation, no AI), routes per profile (high-LTV
// lapsed -> human call list, everyone else -> WhatsApp), and never touches
// control rows. Called from the API on "Approve & Send" and by the worker
// as a safety net for approved-but-unsent campaigns.

import fs from "node:fs";
import path from "node:path";
import type { Campaign, Channel, Tenant } from "@hpas/types";
import {
  getCampaign,
  getFeaturesForProfiles,
  getProfilesByIds,
  getSegment,
  messagesForCampaign,
  query,
  setCampaignStatus,
  updateMessageStatus,
} from "@hpas/db";
import { renderTemplate, variablesForProfile } from "@hpas/core";
import { ensureCampaignTemplate } from "./whatsapp.js";
import { buildCallListCsv, type CallListEntry } from "./call-list.js";
import { send } from "./index.js";

export interface SendCampaignResult {
  sent: number;
  failed: number;
  callList: number;
  control: number;
  callListFile: string | null;
}

export async function sendApprovedCampaign(
  tenant: Tenant,
  campaignId: string,
  opts: { exportsDir?: string } = {}
): Promise<SendCampaignResult> {
  const campaign = await getCampaign(tenant.id, campaignId);
  if (!campaign) throw new Error(`campaign ${campaignId} not found for tenant`);
  if (campaign.status !== "approved") {
    throw new Error(`campaign is "${campaign.status}" — only approved campaigns send`);
  }
  if (!campaign.generatedCopy) throw new Error("campaign has no generated copy");

  const segment = await getSegment(tenant.id, campaign.segmentId);
  if (!segment) throw new Error("segment not found");

  await ensureCampaignTemplate(
    tenant,
    segment.campaignType,
    campaign.generatedCopy.template,
    campaign.generatedCopy.variables
  );

  const messages = await messagesForCampaign(campaign.id);
  const profileIds = messages.map((m) => m.profileId);
  const [profiles, features] = await Promise.all([
    getProfilesByIds(tenant.id, profileIds),
    getFeaturesForProfiles(tenant.id, profileIds),
  ]);
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const featuresById = new Map(features.map((f) => [f.profileId, f]));

  const festivalName = nearestFestivalName(tenant);
  const callThreshold = tenant.config.channels.callList.minLtvThreshold;
  const callListEnabled = tenant.config.channels.callList.enabled;

  const result: SendCampaignResult = { sent: 0, failed: 0, callList: 0, control: 0, callListFile: null };
  const callEntries: CallListEntry[] = [];

  for (const message of messages) {
    if (message.isControl) {
      result.control++;
      continue; // control profiles are NEVER sent to
    }
    const profile = profileById.get(message.profileId);
    const f = featuresById.get(message.profileId);
    if (!profile) {
      await updateMessageStatus(message.id, "failed");
      result.failed++;
      continue;
    }

    const rendered = renderTemplate(
      campaign.generatedCopy.template,
      variablesForProfile(profile, f, {
        shop_name: tenant.config.branding.shopName,
        redemption_code: message.redemptionCode ?? "",
        festival_name: festivalName,
      })
    );

    // Routing: high-LTV winback audiences get a human call, not a blast.
    const channel: Channel =
      callListEnabled &&
      segment.campaignType === "winback" &&
      (f?.monetaryLtv ?? 0) >= callThreshold
        ? "call"
        : "whatsapp";

    const sendResult = await send(channel, tenant, profile, rendered, {
      tenantId: tenant.id,
      campaignId: campaign.id,
      messageId: message.id,
      campaignType: segment.campaignType,
      redemptionCode: message.redemptionCode,
    });

    await query(
      `UPDATE messages SET channel = $2, rendered_text = $3, status = $4, sent_at = now()
       WHERE id = $1`,
      [message.id, channel, rendered, sendResult.ok ? "sent" : "failed"]
    );

    if (!sendResult.ok) {
      result.failed++;
      continue;
    }
    if (channel === "call") {
      result.callList++;
      if (f) callEntries.push({ profile, features: f, redemptionCode: message.redemptionCode });
    } else {
      result.sent++;
    }
  }

  if (callEntries.length > 0) {
    const dir = opts.exportsDir ?? path.resolve(process.cwd(), "exports");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `call-list-${tenant.config.slug}-${campaign.id.slice(0, 8)}.csv`);
    fs.writeFileSync(file, buildCallListCsv(tenant, callEntries));
    result.callListFile = file;
  }

  await setCampaignStatus(tenant.id, campaign.id, "sent");
  return result;
}

function nearestFestivalName(tenant: Tenant): string {
  const today = new Date().toISOString().slice(0, 10);
  const future = tenant.config.festivals
    .filter((f) => f.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  return future[0]?.name ?? tenant.config.festivals[tenant.config.festivals.length - 1]?.name ?? "";
}

export type { Campaign };
