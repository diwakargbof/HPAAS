// 1:1 direct message from the shop owner (Counter page). Recorded in
// direct_messages — never in campaign messages, so attribution and
// hold-out accounting stay clean.
//
// TODO(whatsapp-live): Meta allows free-form 1:1 text only inside the 24h
// customer-service window; outside it an approved utility template is
// required. In stub mode we simply record the send.

import type { DirectMessage, Profile, Tenant } from "@hpas/types";
import { getOptedOutPhones, getTenantChannelSecrets, insertDirectMessage } from "@hpas/db";

export async function sendDirectMessage(
  tenant: Tenant,
  profile: Profile,
  body: string,
  sentBy: string
): Promise<DirectMessage> {
  const optedOut = await getOptedOutPhones(tenant.id);
  const blocked = optedOut.has(profile.phone);

  const secrets = await getTenantChannelSecrets(tenant.id);
  if (!blocked && secrets.whatsappMode === "live") {
    // TODO(whatsapp-live): POST free-form text via /{phone_number_id}/messages
    // when inside the service window, else send an approved utility template.
  }

  return insertDirectMessage({
    tenantId: tenant.id,
    profileId: profile.id,
    channel: "whatsapp",
    body,
    status: blocked ? "failed" : "sent",
    sentBy,
  });
}
