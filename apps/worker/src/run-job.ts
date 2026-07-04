// Run one worker job by name:  pnpm worker <job>
import { closePool } from "@hpas/db";
import { computeFeaturesJob } from "./jobs/compute-features.js";

export const JOBS: Record<string, () => Promise<void>> = {
  "compute-features": computeFeaturesJob,
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
