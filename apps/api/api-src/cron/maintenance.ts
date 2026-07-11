// Vercel Cron target: the approved-but-unsent safety net (approvals
// normally send inline from the API request handler) + the WhatsApp ->
// email fallback sweep. Combined for the same reason as nightly.ts — see
// DEPLOYMENT.md for splitting these onto more frequent schedules on Pro.
import type { IncomingMessage, ServerResponse } from "node:http";
import { sendCampaignsJob, emailFallbackJob } from "@hpas/jobs";
import { isAuthorizedCronRequest, rejectUnauthorized } from "./_auth.js";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!isAuthorizedCronRequest(req)) return rejectUnauthorized(res);

  try {
    await sendCampaignsJob();
    await emailFallbackJob();
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error("[cron/maintenance] failed:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: String(err) }));
  }
}
