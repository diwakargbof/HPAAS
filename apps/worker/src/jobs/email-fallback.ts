import { runEmailFallback } from "@hpas/channels";
import { listTenants } from "@hpas/db";

/** Hourly: WhatsApp undelivered/unread >48h + email on file -> email fallback. */
export async function emailFallbackJob(): Promise<void> {
  for (const tenant of await listTenants()) {
    const { fallbacks } = await runEmailFallback(tenant);
    if (fallbacks > 0) console.log(`[fallback] ${tenant.name}: ${fallbacks} emails sent`);
  }
}
