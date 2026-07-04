// Long-running worker: cron schedules for all background jobs.
import cron from "node-cron";
import { computeFeaturesJob } from "./jobs/compute-features.js";

function safely(name: string, fn: () => Promise<void>): () => void {
  return () => {
    fn().catch((err) => console.error(`[${name}] failed:`, err));
  };
}

// Nightly feature recompute at 02:00 IST.
cron.schedule("0 2 * * *", safely("features", computeFeaturesJob), {
  timezone: "Asia/Kolkata",
});

console.log("hpas worker running (cron schedules active)");
