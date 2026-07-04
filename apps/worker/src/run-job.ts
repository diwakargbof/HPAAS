// Run one worker job by name:  pnpm worker <job>
import { closePool } from "@hpas/db";
import { computeFeaturesJob } from "./jobs/compute-features.js";
import { evaluateTriggersJob } from "./jobs/evaluate-triggers.js";
import { sendCampaignsJob } from "./jobs/send-campaigns.js";
import { emailFallbackJob } from "./jobs/email-fallback.js";

export const JOBS: Record<string, () => Promise<void>> = {
  "compute-features": computeFeaturesJob,
  "evaluate-triggers": evaluateTriggersJob,
  "send-campaigns": sendCampaignsJob,
  "email-fallback": emailFallbackJob,
};

const name = process.argv[2];
const job = name ? JOBS[name] : undefined;
if (!job) {
  console.error(`usage: pnpm worker <job>\navailable: ${Object.keys(JOBS).join(", ")}`);
  process.exit(1);
}
job()
  .then(() => closePool())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
