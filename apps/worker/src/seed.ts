// Seed a tenant from its tenants/<slug>/ folder: tenant row, default
// preferences, standard segments, seed CSV ingestion, feature computation.
// Idempotent — safe to re-run. Onboarding a new shop = new folder + this.
//
//   pnpm db:seed                 (all tenant folders)
//   pnpm db:seed --tenant dadus

import {
  backfillLoyaltyFromHistory,
  computeFeaturesForTenant,
  evaluateTriggersForTenant,
  importMenuFromHistory,
  ingestNormalizedEvents,
  mapCsvRows,
  parseCsv,
  seedStandardSegments,
} from "@hpas/core";
import { makeCopyGenerator } from "@hpas/jobs";
import {
  closePool,
  createTenant,
  createUpload,
  finishUpload,
  queryOne,
  upsertPreference,
} from "@hpas/db";
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

  // Events are append-only: re-ingesting the same CSV would duplicate
  // history, so seed ingestion only runs on a tenant with no events yet.
  const existing = await queryOne<{ n: string }>(
    `SELECT count(*)::text AS n FROM events WHERE tenant_id = $1`,
    [tenant.id]
  );
  const hasEvents = Number(existing?.n ?? 0) > 0;
  const csv = hasEvents ? null : readSeedCsv(slug);
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
    console.log(
      hasEvents
        ? `[seed] events already present — skipping CSV ingestion`
        : `[seed] no seed-data.csv — skipping ingestion`
    );
  }

  const { profiles } = await computeFeaturesForTenant(tenant);
  console.log(`[seed] features computed for ${profiles} profiles`);

  // Loyalty: purchases ingested by this run already earned points inline;
  // history that predates the loyalty ledger gets one backfill entry per
  // profile (no-op unless the ledger is completely empty).
  const backfilled = await backfillLoyaltyFromHistory(tenant);
  if (backfilled > 0) console.log(`[seed] loyalty backfilled for ${backfilled} profiles`);

  // Menu cold-start from sales history, so counter recommendations have a
  // catalog to draw from on day one. Idempotent: skips existing names.
  const menu = await importMenuFromHistory(tenant.id);
  if (menu.imported > 0) console.log(`[seed] menu: imported ${menu.imported} items from history`);

  // Demo path: land one campaign per segment type in the approval queue so
  // the dashboard shows a working pilot immediately. ignoreFestivalWindow
  // is demo-only — the cron trigger always respects festival windows.
  const results = await evaluateTriggersForTenant(tenant, {
    ignoreFestivalWindow: true,
    generateCopy: makeCopyGenerator(),
  });
  for (const r of results) {
    console.log(
      `[seed] ${r.segment}: ${r.outcome}` +
        (r.outcome === "campaign_created"
          ? ` (audience=${r.audienceSize}, control=${r.controlCount})`
          : ` (${r.reason})`)
    );
  }
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
