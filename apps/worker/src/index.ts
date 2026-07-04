// Long-running worker: cron schedules for all background jobs.
import cron from "node-cron";
import { computeFeaturesJob } from "./jobs/compute-features.js";
import { evaluateTriggersJob } from "./jobs/evaluate-triggers.js";

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

console.log("hpas worker running (cron schedules active)");
