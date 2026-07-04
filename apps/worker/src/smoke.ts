// End-to-end smoke test on a dedicated scratch tenant (proving in passing
// that a second tenant runs through the same code with zero changes):
//   seed tenant -> ingest events -> compute features -> trigger engine
//   (suppression + hold-out) -> AI copy cached -> approve -> send ->
//   messages rows with control group assigned and personalized text.
//
//   pnpm smoke

import assert from "node:assert/strict";
import {
  computeFeaturesForTenant,
  evaluateTriggersForTenant,
  ingestNormalizedEvents,
  seedStandardSegments,
} from "@hpas/core";
import { sendApprovedCampaign } from "@hpas/channels";
import {
  closePool,
  createTenant,
  getPool,
  listCampaigns,
  messagesForCampaign,
  setCampaignStatus,
  upsertPreference,
} from "@hpas/db";
import { ALL_CAMPAIGN_TYPES, type NormalizedEvent, type TenantConfig } from "@hpas/types";
import { makeCopyGenerator } from "@hpas/jobs";
import { apiKeyForSlug } from "./tenant-files.js";

const SLUG = "smoketest";
const DAY = 86_400_000;

const config: TenantConfig = {
  slug: SLUG,
  branding: {
    shopName: "Smoke Test Bakery",
    logoUrl: "",
    colors: { primary: "#1e5128", accent: "#4e9f3d", background: "#f8fbf6" },
  },
  modules: {
    insights: { enabled: true, order: 1 },
    campaigns: { enabled: true, order: 2 },
    preferences: { enabled: true, order: 3 },
    data: { enabled: true, order: 4 },
    settings: { enabled: true, order: 5 },
  },
  brandVoice: {
    tone: "cheerful and brief",
    language: "en-IN",
    samplePhrases: ["Fresh out of the oven!"],
    avoid: [],
  },
  festivals: [
    { name: "Diwali", date: "2025-10-20", preWindowDays: 14, categories: ["cakes"] },
  ],
  posColumnMapping: {
    phone: "Phone",
    amount: "Amount",
    items: "Items",
    itemsDelimiter: ";",
    itemFormat: "name|category|qty|unitPrice",
    itemPartsDelimiter: "|",
    timestamp: "Date",
    dateFormat: "DD/MM/YYYY HH:mm",
  },
  channels: {
    whatsapp: { enabled: true, number: "+911100000000" },
    email: { enabled: true, fromAddress: "hello@smoketest.example" },
    callList: { enabled: true, minLtvThreshold: 999999 },
  },
};

async function wipePreviousRun(): Promise<void> {
  const pool = getPool();
  const t = await pool.query(`SELECT id FROM tenants WHERE slug = $1`, [SLUG]);
  if (t.rows.length === 0) return;
  const id = t.rows[0].id;
  await pool.query(`DELETE FROM messages WHERE campaign_id IN (SELECT id FROM campaigns WHERE tenant_id = $1)`, [id]);
  // FK order: everything referencing profiles must go before profiles.
  for (const table of ["loyalty_ledger", "direct_messages", "counter_cards", "menu_items", "campaigns", "segments", "features", "events", "whatsapp_templates", "whatsapp_opt_ins", "opt_outs", "preferences", "uploads", "profiles", "tenants"]) {
    await pool.query(`DELETE FROM ${table} WHERE ${table === "tenants" ? "id" : "tenant_id"} = $1`, [id]);
  }
}

function syntheticEvents(tenantId: string, now: number): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];
  const purchase = (phone: string, name: string, daysAgo: number, amount: number): NormalizedEvent => ({
    tenantId,
    phone,
    traits: { name },
    eventType: "purchase",
    items: [{ name: "Chocolate Cake", category: "cakes", qty: 1, unitPrice: amount }],
    amount,
    ts: new Date(now - daysAgo * DAY),
  });

  // 12 lapsed customers (last purchase 62-84 days ago, some history before)
  for (let i = 0; i < 12; i++) {
    const phone = `+9198220100${String(10 + i)}`;
    events.push(purchase(phone, `Lapsed ${i}`, 62 + i * 2, 400));
    events.push(purchase(phone, `Lapsed ${i}`, 100 + i * 3, 350));
  }
  // 10 regulars (5 purchases, ~12 day cadence, last one 15 days ago -> due)
  for (let i = 0; i < 10; i++) {
    const phone = `+9198220200${String(10 + i)}`;
    for (let k = 0; k < 5; k++) {
      events.push(purchase(phone, `Regular ${i}`, 15 + k * 12, 300));
    }
  }
  // 8 recent one-timers
  for (let i = 0; i < 8; i++) {
    events.push(purchase(`+9198220300${String(10 + i)}`, `Recent ${i}`, 3 + i, 250));
  }
  return events;
}

async function main(): Promise<void> {
  console.log("[smoke] 1. reset + seed scratch tenant");
  await wipePreviousRun();
  const tenant = await createTenant({
    name: config.branding.shopName,
    slug: SLUG,
    config,
    whatsappNumber: config.channels.whatsapp.number,
    apiKey: apiKeyForSlug(SLUG),
  });
  for (const t of ALL_CAMPAIGN_TYPES) {
    await upsertPreference({ tenantId: tenant.id, campaignType: t, enabled: true, maxPerCustomerPerWeek: 1 });
  }
  await seedStandardSegments(tenant.id);

  console.log("[smoke] 2. ingest synthetic events");
  const { processed } = await ingestNormalizedEvents(tenant, syntheticEvents(tenant.id, Date.now()));
  assert.equal(processed, 12 * 2 + 10 * 5 + 8, "all events ingested");

  console.log("[smoke] 3. compute features");
  const { profiles } = await computeFeaturesForTenant(tenant);
  assert.equal(profiles, 30, "30 profiles have features");

  console.log("[smoke] 4. evaluate triggers (suppression + hold-out + cached copy)");
  const results = await evaluateTriggersForTenant(tenant, {
    ignoreFestivalWindow: true,
    generateCopy: makeCopyGenerator(),
  });
  const created = results.filter((r) => r.outcome === "campaign_created");
  assert.ok(created.length >= 2, `expected >=2 campaigns, got ${created.length}`);

  const pending = await listCampaigns(tenant.id, ["pending_approval"]);
  assert.equal(pending.length, created.length, "campaigns are pending approval");
  assert.ok(pending.every((c) => c.generatedCopy?.template.includes("{{")), "copy cached with placeholders");

  console.log("[smoke] 5. approve + send the win-back campaign");
  const winback = pending.find((c) => c.audienceSize >= 5);
  assert.ok(winback, "a campaign with audience >= 5 exists");
  await setCampaignStatus(tenant.id, winback.id, "approved", "smoke");
  const sendResult = await sendApprovedCampaign(tenant, winback.id);
  assert.ok(sendResult.sent > 0, "messages were sent");
  assert.equal(sendResult.failed, 0, "no failed sends");

  console.log("[smoke] 6. verify messages table: control group + personalization");
  const messages = await messagesForCampaign(winback.id);
  const control = messages.filter((m) => m.isControl);
  const treatment = messages.filter((m) => !m.isControl);
  assert.ok(control.length >= 1, "hold-out control assigned");
  assert.ok(
    control.length / messages.length >= 0.1 && control.length / messages.length <= 0.3,
    `control share ~15-20% (got ${((control.length / messages.length) * 100).toFixed(0)}%)`
  );
  assert.ok(control.every((m) => m.status === "queued" && m.sentAt === null), "controls never sent");
  assert.ok(treatment.every((m) => m.status === "sent"), "all treatment messages sent");
  assert.ok(treatment.every((m) => m.renderedText.length > 0 && !m.renderedText.includes("{{")), "text fully interpolated");
  assert.ok(treatment.every((m) => m.redemptionCode), "treatment messages carry redemption codes");
  assert.ok(new Set(treatment.map((m) => m.renderedText)).size > 1, "messages are personalized per customer");

  console.log(
    `[smoke] PASS — ${created.length} campaigns created, ` +
      `${treatment.length} sent + ${control.length} control on the approved one`
  );
}

main()
  .then(() => closePool())
  .catch((err) => {
    console.error("[smoke] FAIL:", err);
    process.exit(1);
  });
