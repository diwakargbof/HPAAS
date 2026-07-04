// Fallback rule: WhatsApp message still undelivered/unread 48h after send
// and the profile has an email -> send the same rendered text by email.
// The message row is switched to the email channel so attribution counts
// each enrolled profile exactly once.

import type { Tenant } from "@hpas/types";
import { getProfilesByIds, messagesNeedingFallback, query } from "@hpas/db";
import { sendViaEmail } from "./email.js";

export async function runEmailFallback(tenant: Tenant): Promise<{ fallbacks: number }> {
  const stale = await messagesNeedingFallback(tenant.id);
  if (stale.length === 0) return { fallbacks: 0 };

  const profiles = await getProfilesByIds(tenant.id, stale.map((m) => m.profileId));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  let fallbacks = 0;
  for (const message of stale) {
    const profile = profileById.get(message.profileId);
    if (!profile || typeof profile.traits.email !== "string") continue;

    const result = await sendViaEmail(tenant, profile, message.renderedText, {
      tenantId: tenant.id,
      campaignId: message.campaignId,
      messageId: message.id,
      campaignType: message.campaignType,
      redemptionCode: message.redemptionCode,
    });
    if (result.ok) {
      await query(
        `UPDATE messages SET channel = 'email', status = 'sent', sent_at = now() WHERE id = $1`,
        [message.id]
      );
      fallbacks++;
    }
  }
  return { fallbacks };
}
