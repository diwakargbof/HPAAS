// Helpers for reading tenants/<slug>/ folders (config.json + seed-data.csv).
// Only the seed script touches the filesystem; at runtime tenants come
// from the DB.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TenantConfig } from "@hpas/types";

export const TENANTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../tenants"
);

export function listTenantSlugs(): string[] {
  return fs
    .readdirSync(TENANTS_DIR)
    .filter((d) => !d.startsWith("_") && fs.existsSync(path.join(TENANTS_DIR, d, "config.json")));
}

export function readTenantConfig(slug: string): TenantConfig {
  const file = path.join(TENANTS_DIR, slug, "config.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as TenantConfig;
}

export function readSeedCsv(slug: string): string | null {
  const file = path.join(TENANTS_DIR, slug, "seed-data.csv");
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

/** Stable per-environment API key so seeding is idempotent and documentable. */
export function apiKeyForSlug(slug: string): string {
  const secret = process.env.AUTH_SECRET ?? "dev-secret-change-me";
  const digest = crypto.createHash("sha256").update(`${slug}:${secret}`).digest("hex");
  return `hpas_${slug}_${digest.slice(0, 16)}`;
}
