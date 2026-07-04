// Seed a tenant from its tenants/<slug>/ folder: tenant row, default
// preferences, standard segments, seed CSV ingestion, feature computation.
// Idempotent — safe to re-run. Onboarding a new shop = new folder + this.
//
//   pnpm db:seed                 (all tenant folders)
//   pnpm db:seed --tenant dadus

import {
  computeFeaturesForTenant,
  ingestNormalizedEvents,
  mapCsvRows,
  parseCsv,
  seedStandardSegments,
} from "@hpas/core";
import { closePool, createTenant, createUpload, finishUpload, upsertPreference } from "@hpas/db";
import { ALL_CAMPAIGN_TYPES } from "@hpas/types";
import { apiKeyForSlug, listTenantSlugs, readSeedCsv, readTenantConfig } from "./tenant-files.js";

export async function seedTenant(slug: string): Promise<void> {
  const config = readTenantConfig(slug);
  const tenant = await createTenant({
    name: config.branding.shopName,
    slug: config.slug,
    config,
    whatsappNumber: config.channels.whatsapp.number,
    apiKey: apiKeyForSlug(slug),
  });
  console.log(`[seed] tenant "${tenant.name}" (${slug}) — api key: ${tenant.apiKey}`);

  for (const campaignType of ALL_CAMPAIGN_TYPES) {
    await upsertPreference({
      tenantId: tenant.id,
      campaignType,
      enabled: true,
      maxPerCustomerPerWeek: 1,
    });
  }

  await seedStandardSegments(tenant.id);
  console.log(`[seed] standard segments + default preferences in place`);

  const csv = readSeedCsv(slug);
  if (csv) {
    const uploadRow = await createUpload(tenant.id, "seed-data.csv");
    const rows = parseCsv(csv);
    const { events, errors } = mapCsvRows(tenant.id, rows, config.posColumnMapping);
    const { processed } = await ingestNormalizedEvents(tenant, events);
    await finishUpload(
      tenant.id,
      uploadRow.id,
      processed > 0 ? "success" : "error",
      processed,
      errors.length ? errors.map((e) => `row ${e.rowNumber}: ${e.reason}`).join("\n") : null
    );
    console.log(`[seed] ingested ${processed}/${rows.length} rows (${errors.length} row errors)`);
  } else {
    console.log(`[seed] no seed-data.csv — skipping ingestion`);
  }

  const { profiles } = await computeFeaturesForTenant(tenant);
  console.log(`[seed] features computed for ${profiles} profiles`);
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("seed.ts");
if (isDirectRun) {
  const flagIdx = process.argv.indexOf("--tenant");
  const slugs = flagIdx > -1 ? [process.argv[flagIdx + 1]] : listTenantSlugs();
  (async () => {
    for (const slug of slugs) await seedTenant(slug);
    await closePool();
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
