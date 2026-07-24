// Email adapter — simpler fallback channel. Resend-shaped.
// EMAIL_MODE=stub (default) records sends without HTTP.
// TODO(email-live): set EMAIL_MODE=resend + RESEND_API_KEY, and verify the
// tenant's from-address domain in Resend.

import type { Invoice, Profile, SendMeta, SendResult, Tenant } from "@hpas/types";
import { getTenantChannelSecrets } from "@hpas/db";

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

  const secrets = await getTenantChannelSecrets(tenant.id);
  if (secrets.emailMode !== "resend") {
    return { ok: true, providerMessageId: `stub-email-${meta.messageId}` };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secrets.resendApiKey}`,
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

/**
 * Emails the printable invoice link — separate from sendViaEmail, which is
 * tightly coupled to the campaign Message/SendMeta shape and a fixed
 * subject line. Same Resend call shape, its own subject/body.
 */
export async function sendInvoiceEmail(
  tenant: Tenant,
  profile: Profile,
  invoice: Invoice,
  printUrl: string
): Promise<{ status: "sent" | "failed" }> {
  const email = typeof profile.traits.email === "string" ? profile.traits.email : null;
  if (!email || !tenant.config.channels.email.enabled) return { status: "failed" };

  const secrets = await getTenantChannelSecrets(tenant.id);
  if (secrets.emailMode !== "resend") return { status: "sent" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secrets.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: tenant.config.channels.email.fromAddress,
      to: email,
      subject: `Invoice ${invoice.invoiceNumber} from ${tenant.config.branding.shopName}`,
      text: `Thank you for your purchase! Your invoice ${invoice.invoiceNumber} (₹${invoice.totalAmount.toFixed(2)}) is ready:\n${printUrl}`,
    }),
  });
  return { status: res.ok ? "sent" : "failed" };
}
