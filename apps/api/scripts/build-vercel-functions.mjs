// Bundles the Vercel-only entry points (api-src/**) into self-contained
// JS under api/**, the directory Vercel's zero-config builder scans.
//
// Why: @hpas/* workspace packages are pnpm symlinks. Vercel's Node builder
// has been observed to trace their real files into the deployed function
// but drop the node_modules/@hpas/* symlink itself, so the bare import
// "@hpas/db" throws ERR_MODULE_NOT_FOUND at runtime even though the build
// "succeeds". Inlining @hpas/* at build time removes the bare specifier
// entirely, so there's nothing left for Vercel to fail to resolve.
// Real npm deps (express, pg, ...) are left external — they aren't
// symlinks and resolve fine as-is.
import { build } from "esbuild";

const external = ["express", "cors", "pg", "dotenv", "multer", "qrcode"];

const entries = [
  { in: "api-src/index.ts", out: "api/index.js" },
  { in: "api-src/cron/nightly.ts", out: "api/cron/nightly.js" },
  { in: "api-src/cron/maintenance.ts", out: "api/cron/maintenance.js" },
];

for (const entry of entries) {
  await build({
    entryPoints: [entry.in],
    outfile: entry.out,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    external,
    logLevel: "info",
  });
}
