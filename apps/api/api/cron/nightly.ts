// Vercel Cron target: feature recompute + trigger evaluation, in sequence,
// once nightly. Combined into one endpoint so the schedule fits within
// Vercel Hobby's 2-cron-job limit — see DEPLOYMENT.md for the Pro-plan
// alternative that splits these into separate, more frequent schedules.
import type { IncomingMessage, ServerResponse } from "node:http";
import { computeFeaturesJob, evaluateTriggersJob } from "@hpas/jobs";
import { isAuthorizedCronRequest, rejectUnauthorized } from "./_auth.js";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!isAuthorizedCronRequest(req)) return rejectUnauthorized(res);

  try {
    await computeFeaturesJob();
    await evaluateTriggersJob();
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error("[cron/nightly] failed:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: String(err) }));
  }
}
