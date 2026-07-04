# CLAUDE.md

HPAS — multi-tenant, AI-powered customer engagement platform for small Indian retail shops
(WhatsApp-first). pnpm monorepo: `apps/` (api, dashboard, worker), `packages/` (core, db,
channels, ai, jobs, types), `tenants/` (per-shop config folders — a tenant is config, never code).

## Knowledge graph — MANDATORY workflow

[KNOWLEDGE_GRAPH.md](./KNOWLEDGE_GRAPH.md) is the authoritative map of every feature, its
files, and its dependency edges.

1. **Before making ANY code change**, read `KNOWLEDGE_GRAPH.md` first. Locate the node(s)
   you're touching and check their *Depends on* / *Used by* edges so you understand the
   blast radius before editing.
2. **After making ANY code change**, update `KNOWLEDGE_GRAPH.md` in the same change set:
   - New feature/module/endpoint/job/migration → add or extend a node (purpose, files, edges)
     and the Mermaid diagram if it's on a main flow.
   - Modified feature → refresh its one-liner, file list, and both directions of its edges.
   - Removed feature → delete the node and purge it from every other node's edge lists and
     the diagram.
   Follow the "Maintenance protocol" section at the bottom of the graph file.
3. If the graph and the code disagree, the code is truth — fix the graph as part of your change.

## Architecture invariants (do not violate)

- **Deterministic vs AI split**: `packages/core` must stay LLM-free. The ONLY LLM call sites
  are the four functions in `packages/ai`; all are authoring-time or cached — never inside a
  send loop. Core↔AI wiring happens only via injected callbacks (`packages/jobs/src/copy-generator.ts`).
- **Tenancy**: every business-table query takes `tenant_id`; tenants resolve from credentials
  (API key / session), never from request bodies.
- **Phone numbers**: every ingestion point must use `normalizePhone` from `packages/core/src/phone.ts` —
  never reimplement normalization.
- **Suppression has no bypass**: every campaign enrollment passes through `applySuppression`.
- **Nothing sends without approval**: the trigger engine only creates `pending_approval`
  campaigns; sending happens via the dashboard approve gate (worker cron is the safety net).
- **Deploy-target-neutral**: `apps/api/src/app.ts` never calls `listen()`; jobs live in
  `packages/jobs` and are invoked identically by worker cron and Vercel Cron. No writes to
  local disk at runtime (Vercel filesystem is read-only).
- **Tenant onboarding is zero-code**: new shops are `tenants/<slug>/config.json` + seed —
  if a change requires per-tenant code, it's the wrong design.

## Commands

- `pnpm typecheck` — all packages (run after changes)
- `pnpm smoke` — end-to-end test on a scratch tenant
- `pnpm db:migrate` / `pnpm db:seed` — migrations / idempotent seed
- `pnpm dev:api` (:4000) / `pnpm dev:dashboard` (:3000) / `pnpm dev:worker`
- `pnpm worker <job>` — compute-features | evaluate-triggers | send-campaigns | email-fallback
