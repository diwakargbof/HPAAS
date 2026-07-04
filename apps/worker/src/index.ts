// Long-running worker: cron schedules for all background jobs. This is the
// entrypoint for a persistent-host deployment (Railway/Render/Fly/VM). On
// Vercel, the same job functions run instead as Vercel Cron-triggered HTTP
// endpoints — see apps/api/api/cron/*.ts — so this process is never used
// there.
import cron from "node-cron";
import { computeFeaturesJob, evaluateTriggersJob, sendCampaignsJob, emailFallbackJob } from "@hpas/jobs";

function safely(name: string, fn: () => Promise<void>): () => void {
  return () => {
    fn().catch((err) => console.error(`[${name}] failed:`, err));
  };
}

// Nightly feature recompute at 02:00 IST.
cron.schedule("0 2 * * *", safely("features", computeFeaturesJob), {
  timezone: "Asia/Kolkata",
});

// Trigger evaluation at 03:00 IST — after features are fresh. Creates
// pending_approval campaigns only; nothing sends without dashboard approval.
cron.schedule("0 3 * * *", safely("triggers", evaluateTriggersJob), {
  timezone: "Asia/Kolkata",
});

// Safety net for approved-but-unsent campaigns, every 5 minutes.
cron.schedule("*/5 * * * *", safely("send", sendCampaignsJob));

// WhatsApp -> email fallback sweep, hourly.
cron.schedule("0 * * * *", safely("fallback", emailFallbackJob));

console.log("hpas worker running (cron schedules active)");
