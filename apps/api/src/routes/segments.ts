// Segment management — where AI segmentation meets the deterministic rule
// engine. The AI only ever authors rule JSON; every proposal is compiled
// through core's whitelisted compiler and previewed against real data
// before anything is saved. A hallucinated column dies here, loudly.

import { Router } from "express";
import { authorSegmentFromPrompt, discoverSegments, type SegmentContext } from "@hpas/ai";
import { audienceForSegment, compileRule, evaluateTriggersForTenant } from "@hpas/core";
import { makeCopyGenerator } from "@hpas/jobs";
import {
  deleteSegment,
  listSegments,
  segmentDiscoveryStats,
  selectAudience,
  upsertSegment,
} from "@hpas/db";
import { ALL_CAMPAIGN_TYPES, type SegmentRule, type Tenant } from "@hpas/types";

export const segmentsRouter: import("express").Router = Router();

async function contextFor(tenant: Tenant): Promise<{
  context: SegmentContext;
  stats: Awaited<ReturnType<typeof segmentDiscoveryStats>>;
}> {
  const stats = await segmentDiscoveryStats(tenant.id);
  return {
    context: {
      shopName: tenant.config.branding.shopName,
      categories: stats.categorySpend.map((c) => c.category),
      ltvQuartiles: stats.ltvQuartiles,
      totalProfiles: stats.totalProfiles,
    },
    stats,
  };
}

/** Compile (whitelist check) + count the audience. Throws on a bad rule. */
async function previewRule(tenant: Tenant, rule: SegmentRule): Promise<number> {
  const { whereSql, params } = compileRule(rule);
  const audience = await selectAudience(tenant.id, whereSql, params);
  return audience.length;
}

segmentsRouter.get("/segments", async (req, res) => {
  const tenant = req.tenant!;
  const segments = await listSegments(tenant.id);
  const items = await Promise.all(
    segments.map(async (s) => ({
      ...s,
      audienceSize: (await audienceForSegment(tenant, s)).length,
    }))
  );
  res.json({ segments: items });
});

/** Natural language -> validated, previewed proposal. Nothing is saved. */
segmentsRouter.post("/segments/preview", async (req, res) => {
  const tenant = req.tenant!;
  const prompt = String(req.body?.prompt ?? "").trim();
  if (!prompt) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }
  try {
    const { context } = await contextFor(tenant);
    const proposal = await authorSegmentFromPrompt({ prompt, context });
    const audienceSize = await previewRule(tenant, proposal.rule);
    res.json({ proposal: { ...proposal, audienceSize } });
  } catch (err) {
    res.status(422).json({
      error: `couldn't turn that into a segment: ${err instanceof Error ? err.message : err}`,
    });
  }
});

/** AI discovery: aggregate stats -> proposed segments (validated + sized). */
segmentsRouter.post("/segments/discover", async (req, res) => {
  const tenant = req.tenant!;
  const { context, stats } = await contextFor(tenant);
  const existing = await listSegments(tenant.id);
  const proposals = await discoverSegments({
    context,
    stats: {
      recencyBuckets: stats.recencyBuckets,
      categorySpend: stats.categorySpend,
      festivalBuyers: stats.festivalBuyers,
      withCadence: stats.withCadence,
    },
    existingSegmentNames: existing.map((s) => s.name),
  });

  const sized = [];
  for (const p of proposals) {
    try {
      sized.push({ ...p, audienceSize: await previewRule(tenant, p.rule) });
    } catch {
      // drop proposals whose rules don't compile — the whitelist won
    }
  }
  res.json({ proposals: sized });
});

/** Save a (previewed) segment. The rule is re-validated server-side. */
segmentsRouter.post("/segments", async (req, res) => {
  const tenant = req.tenant!;
  const { name, description, campaignType, rule, source } = req.body ?? {};
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (!ALL_CAMPAIGN_TYPES.includes(campaignType)) {
    res.status(400).json({ error: `campaignType must be one of ${ALL_CAMPAIGN_TYPES.join(", ")}` });
    return;
  }
  try {
    const audienceSize = await previewRule(tenant, rule);
    const segment = await upsertSegment(tenant.id, name.trim().slice(0, 60), rule, campaignType, {
      description: typeof description === "string" ? description : null,
      source: source === "ai_suggested" ? "ai_suggested" : "custom",
    });
    res.json({ segment: { ...segment, audienceSize } });
  } catch (err) {
    res.status(422).json({ error: `invalid rule: ${err instanceof Error ? err.message : err}` });
  }
});

/** Create a campaign from one segment right now -> lands in the approval queue. */
segmentsRouter.post("/segments/:id/run", async (req, res) => {
  const tenant = req.tenant!;
  const results = await evaluateTriggersForTenant(tenant, {
    segmentId: req.params.id,
    // The owner explicitly asked — honor intent even outside a festival window.
    ignoreFestivalWindow: true,
    generateCopy: makeCopyGenerator(),
  });
  const result = results[0];
  if (!result) {
    res.status(404).json({ error: "segment not found" });
    return;
  }
  res.json({ result });
});

segmentsRouter.delete("/segments/:id", async (req, res) => {
  const tenant = req.tenant!;
  const deleted = await deleteSegment(tenant.id, req.params.id);
  if (!deleted) {
    res.status(409).json({
      error: "this segment has campaign history and can't be deleted",
    });
    return;
  }
  res.json({ ok: true });
});
