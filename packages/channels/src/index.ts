// The one common channel interface: send(channel, profile, message).
// Adapters differ wildly (template rules, opt-ins, human call lists) but
// callers only ever see this signature.

import type { Channel, Profile, SendMeta, SendResult, Tenant } from "@hpas/types";
import { sendViaWhatsApp } from "./whatsapp.js";
import { sendViaEmail } from "./email.js";

export async function send(
  channel: Channel,
  tenant: Tenant,
  profile: Profile,
  renderedText: string,
  meta: SendMeta
): Promise<SendResult> {
  switch (channel) {
    case "whatsapp":
      return sendViaWhatsApp(tenant, profile, renderedText, meta);
    case "email":
      return sendViaEmail(tenant, profile, renderedText, meta);
    case "call":
      // The "send" for a call is putting the customer on the human call
      // list — the export itself happens in the campaign sender.
      return { ok: true, providerMessageId: `call-list-${meta.messageId}` };
  }
}

export * from "./whatsapp.js";
export * from "./email.js";
export * from "./call-list.js";
export * from "./campaign-sender.js";
export * from "./fallback.js";
export * from "./direct.js";
