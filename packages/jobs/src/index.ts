export * from "./copy-generator.js";
export * from "./compute-features.js";
export * from "./evaluate-triggers.js";
export * from "./send-campaigns.js";
export * from "./email-fallback.js";

import { computeFeaturesJob } from "./compute-features.js";
import { evaluateTriggersJob } from "./evaluate-triggers.js";
import { sendCampaignsJob } from "./send-campaigns.js";
import { emailFallbackJob } from "./email-fallback.js";

/** Named job registry — used by both the persistent worker CLI and the Vercel cron handlers. */
export const JOBS = {
  "compute-features": computeFeaturesJob,
  "evaluate-triggers": evaluateTriggersJob,
  "send-campaigns": sendCampaignsJob,
  "email-fallback": emailFallbackJob,
} as const;

export type JobName = keyof typeof JOBS;
