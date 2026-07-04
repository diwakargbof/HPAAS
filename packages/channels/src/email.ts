// Email adapter — simpler fallback channel. Resend-shaped.
// EMAIL_MODE=stub (default) records sends without HTTP.
// TODO(email-live): set EMAIL_MODE=resend + RESEND_API_KEY, and verify the
// tenant's from-address domain in Resend.

import type { Profile, SendMeta, SendResult, Tenant } from "@hpas/types";

export async function sendViaEmail(
  tenant: Tenant,
  profile: Profile,
  renderedText: string,
  meta: SendMeta
): Promise<SendResult> {
  const email = typeof profile.traits.email === "string" ? profile.traits.email : null;
  if (!email) return { ok: false, error: "profile has no email" };
  if (!tenant.config.channels.email.enabled) {
    return { ok: false, error: "email channel disabled for tenant" };
  }

  if (process.env.EMAIL_MODE !== "resend") {
    return { ok: true, providerMessageId: `stub-email-${meta.messageId}` };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: tenant.config.channels.email.fromAddress,
      to: email,
      subject: `A note from ${tenant.config.branding.shopName}`,
      text: renderedText,
    }),
  });
  const body = (await res.json()) as { id?: string; message?: string };
  if (!res.ok || !body.id) return { ok: false, error: body.message ?? `resend ${res.status}` };
  return { ok: true, providerMessageId: body.id };
}
