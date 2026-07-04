// Run one worker job by name:  pnpm worker <job>
import { closePool } from "@hpas/db";
import { JOBS } from "@hpas/jobs";

const name = process.argv[2] as keyof typeof JOBS | undefined;
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
