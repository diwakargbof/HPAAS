# HPAS — Hyper-Personalized Automation System

A multi-tenant, AI-powered customer engagement platform for small retail /
ecommerce shops in India (WhatsApp-first). The first tenant is the sweet shop
chain **Dadu's** — but Dadu's is *configuration and seed data*, never code. A
second shop onboards with a config folder and one command, zero new code
(`tenants/_template/README.md` documents every field; the automated smoke test
actually exercises a second tenant end to end).

## Architecture at a glance

Two very different halves, kept strictly apart:

1. **Deterministic logic (the vast majority):** ingestion, profiles,
   RFM/affinity features, segment *evaluation*, triggers, suppression,
   hold-out control, loyalty points, recommendation *ranking*, sending,
   attribution. Plain TypeScript + Postgres. **No LLM anywhere here.**
2. **Generation (`packages/ai` — four narrow functions, the only LLM call
   sites, all authoring-time or cached, never in a send loop):**
   - `generateCampaignCopy` — one template per campaign, cached on the row;
     send time is plain string interpolation
   - `authorSegmentFromPrompt` — the owner's words → segment rule **as
     data**; the deterministic whitelisted compiler is still the only thing
     that turns rules into SQL, so a hallucinated column dies at preview
   - `discoverSegments` — aggregate, PII-free stats → proposed segments
     with live audience sizes, saved only on the owner's tap
   - `generateCounterPitch` — one cashier line per customer, cached 24h;
     AI cost scales with actual counter footfall, not customer count

   The provider is swappable behind one interface (Anthropic today; a mock
   provider runs everything offline when no API key is set).

Multi-tenancy is row-level and query-enforced: every table carries
`tenant_id`, every query-layer function requires it, and API tenants resolve
from credentials (API key or session token), never from request bodies.

```
hpas/
├── apps/
│   ├── api/          Express app (apps/api/src) — auth, ingestion, approval
│   │                 queue, webhooks. Runs persistently (:4000) via src/index.ts,
│   │                 OR as Vercel Serverless Functions via api/ — see DEPLOYMENT.md
│   ├── dashboard/    Next.js shop-owner app, tenant-themed (:3000)
│   └── worker/       persistent node-cron scheduler + seed/smoke CLIs
│                     (not used on the Vercel path — see packages/jobs)
├── packages/
│   ├── db/           Postgres schema, migrations, tenant-scoped typed queries
│   ├── core/         the "brain": phone normalization, ingestion, features,
│   │                 segment rules, suppression, hold-out, triggers, attribution,
│   │                 loyalty points, counter-recommendation ranking, menu import
│   ├── channels/     WhatsApp (stub/live) + email + call-list + 1:1 direct notes
│   ├── ai/           the ONLY LLM call sites: campaign copy, segment authoring,
│   │                 segment discovery, counter pitch (Anthropic behind one
│   │                 swappable interface; deterministic mock when no API key)
│   ├── jobs/          the 4 scheduled jobs (features, triggers, send, fallback) +
│   │                  AI-copy wiring + counter-card builder — shared by
│   │                  apps/worker's cron AND apps/api (incl. Vercel Cron)
│   └── types/        shared domain types incl. TenantConfig
└── tenants/
    ├── dadus/        config.json + seed-data.csv (186 mock POS rows)
    └── _template/    copy to onboard a new shop; every field documented
```

**Deploying?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for the Supabase + Vercel
path (serverless API + Vercel Cron, no persistent processes). Everything
below is the local/self-hosted workflow.

## Quickstart (fully offline — no API keys needed)

Prereqs: Node 22+, pnpm 9, Postgres (any instance; a Docker container works).

```bash
# 1. Create a database named `hpas` and configure the connection
cp .env.example .env            # edit DATABASE_URL if yours differs

# 2. Install, migrate, seed (tenant, 186 POS rows, features, segments,
#    and one pending campaign per segment type — the working pilot)
pnpm install
pnpm db:migrate
pnpm db:seed

# 3. Run the API and the dashboard
pnpm dev:api                    # http://localhost:4000
pnpm dev:dashboard              # http://localhost:3000
```

Log in at http://localhost:3000 with shop id **dadus**, password **demo**
(the `DEMO_PASSWORD` env var). You land on a working pilot: customer
insights, segment cards, and campaigns already waiting in the approval queue.
Approve one — messages are rendered, "sent" (stub mode), the hold-out control
is kept aside, and attribution starts reporting once redemptions/purchases
arrive.

Other useful commands:

```bash
pnpm smoke                      # end-to-end test on a scratch tenant
pnpm worker <job>               # compute-features | evaluate-triggers |
                                #   send-campaigns | email-fallback
pnpm dev:worker                 # long-running cron worker
pnpm typecheck                  # all packages
```

## The pipeline

```
POS CSV / POST /v1/events
      │  (one shared phone normalizer — the #1 duplicate-profile defense)
      ▼
profiles + append-only events
      ▼  nightly + post-ingest worker job
features (precomputed RFM/affinity — segmentation NEVER computes live)
      ▼  daily trigger engine (cron)
segments (JSON rules in DB) ──► suppression layer (preferences, opt-outs,
      │                          frequency cap — mandatory, no bypass)
      ▼
campaign in pending_approval + hold-out control (~17%) + ONE AI call
      ▼  shop owner taps "Approve & Send" in the dashboard
render cached template per customer → WhatsApp / email / call-list
      ▼
delivery webhooks, replies, redemption codes
      ▼
attribution: messaged vs control → incremental repeat rate + revenue
```

## The AI-native surface

Beyond campaigns, the dashboard has three hyper-personalization modules
(all per-tenant config — a shop can turn any of them off):

- **Segments** (`/segments`): the four standard segments plus two AI paths —
  type an audience in plain words ("big spenders who love gift boxes but
  haven't visited in 45 days") and preview the live audience before saving,
  or tap *Suggest segments* and the AI studies the shop's own aggregate
  numbers (recency buckets, category spend, LTV quartiles — no PII leaves
  the DB) and proposes named, sized segments. Any segment → *Create
  campaign now* → the normal approval queue, suppression included.
- **Counter** (`/loyalty`): type a customer's phone when they walk up and
  get the full card — who they are, loyalty balance (auto-earned on every
  ingested purchase, backfilled from history), 2-3 ranked suggestions from
  their own co-purchase graph + reorder timing + untried menu items +
  festival context, and a one-line pitch to say out loud. Award/redeem
  points and send a personal WhatsApp note from the same screen. The same
  card is exposed to POS software at `GET /v1/counter?phone=` (API key).
- **Menu** (`/menu`): the shop's catalog with prices and stock toggles —
  one tap imports it from sales history. Recommendations only ever suggest
  items that are on the menu and in stock, and new-item campaign copy can
  name real recently-added products.

## Onboarding a second shop (no code)

```bash
cp -r tenants/_template tenants/mithai-house
# edit tenants/mithai-house/config.json  (branding, POS column mapping,
#   festivals, brand voice, channels — see the template README)
# optionally add seed-data.csv in their POS export format
pnpm db:seed --tenant mithai-house
```

Different CSV column names, different festivals, different colors and
modules — all config. The dashboard, segments, suppression, and attribution
work identically.

## Environment variables

See `.env.example` — everything has a working default except `DATABASE_URL`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (database `hpas`) |
| `DIRECT_DATABASE_URL` | optional — non-pooled connection, preferred for migrations (Supabase) |
| `AUTH_SECRET` | HMAC secret for session tokens + derived API keys |
| `DEMO_PASSWORD` | dashboard login password (demo auth) |
| `CRON_SECRET` | required on Vercel only — authorizes Vercel Cron to call `/api/cron/*` |
| `ANTHROPIC_API_KEY` | optional — empty uses the deterministic mock copywriter |
| `ANTHROPIC_MODEL` | default `claude-opus-4-8` |
| `WHATSAPP_MODE` | `stub` (default) or `live` (needs Meta BSP credentials) |
| `EMAIL_MODE` | `stub` (default) or `resend` (needs `RESEND_API_KEY`) |

## Design decisions & assumptions

- **pnpm workspaces (no Turborepo).** 3 apps + 6 packages don't need remote
  caching; Turborepo can be layered on later without restructuring. Packages
  are consumed as TypeScript source (`tsx` at runtime, `transpilePackages`
  for Next) — no build orchestration needed at this scale.
- **Call-list CSVs are stored in the database** (`campaigns.call_list_csv`),
  not written to local disk — a deploy-target-neutral choice that also
  happens to be required on Vercel, where the filesystem outside `/tmp` is
  read-only and nothing written to disk survives between invocations.
  Downloaded on demand via `GET /v1/app/campaigns/:id/call-list.csv`.
- **Deploy-target-neutral by construction**: `apps/api`'s Express app
  (`src/app.ts`) doesn't call `listen()` itself — `src/index.ts` does that
  for a persistent host, while `api/index.ts` exports the same app for
  Vercel to invoke as a serverless function. The four scheduled jobs
  (`packages/jobs`) are called identically by `apps/worker`'s `node-cron`
  loop or by Vercel Cron–triggered endpoints — same job code either way.
- **WhatsApp fully stubbed** (as agreed): the adapter models the real Meta
  Cloud API constraints — **pre-approved templates only** (no approved
  template = refused send), opt-in store, webhook handlers for delivery
  receipts / replies / STOP — but `WHATSAPP_MODE=stub` records instead of
  calling. `TODO(whatsapp-live)` marks every spot that needs real BSP
  credentials.
- **POS import counts as WhatsApp opt-in** for the pilot (existing customer
  relationship). Replace with explicit opt-in collection before scale.
- **Demo auth**: HMAC session tokens + a shared demo password, but shaped
  like real auth (login endpoint, bearer middleware) so an IdP swap touches
  only token issue/verify.
- **Approval sends inline** (the "Approve & Send" request performs the send);
  a 5-minute worker cron is the safety net for approved-but-unsent campaigns.
- **Email fallback updates the same message row** (channel switches to
  `email`) so attribution counts each enrolled customer exactly once.
- **Festival campaigns only trigger inside the configured pre-festival
  window.** The seed's demo path bypasses the window (flagged, demo-only) so
  the approval queue shows all four campaign types immediately.
- **Past festivals stay in the config** — the festival-buyer feature detects
  purchases near *past* festival dates; the trigger engine only looks at
  upcoming ones.
- **Redemption linkage**: redemption events store the code, so attribution
  joins them back to the exact message/campaign. Codes arrive via
  `POST /v1/redemptions` (POS) or typed back over WhatsApp (webhook).

## API surface

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /v1/auth/login` | — | dashboard session |
| `POST /v1/events` | API key | streaming ingestion (single or batch) |
| `POST /v1/uploads` | API key or session | CSV ingestion via tenant column mapping |
| `POST /v1/redemptions` | API key | POS-entered redemption code |
| `GET/POST /v1/webhooks/whatsapp/:slug` | Meta verify token | delivery receipts + inbound |
| `GET /v1/app/insights` | session | customer picture + impact |
| `GET /v1/app/campaigns` | session | approval queue + history |
| `POST /v1/app/campaigns/:id/approve` | session | **the** send gate |
| `POST /v1/app/campaigns/:id/reject` | session | reject |
| `PUT /v1/app/campaigns/:id/template` | session | edit copy (validated) |
| `GET /v1/app/campaigns/:id/call-list.csv` | session | download the human call-list CSV |
| `GET /v1/app/attribution/:id` | session | messaged-vs-control report |
| `GET/PUT /v1/app/preferences` | session | toggles + frequency cap |
| `GET /v1/app/settings` | session | WhatsApp status, branding, API key |
| `GET /v1/app/segments` | session | segments with live audience sizes |
| `POST /v1/app/segments/preview` | session | plain words → AI rule + audience preview |
| `POST /v1/app/segments/discover` | session | AI-proposed segments from aggregate stats |
| `POST /v1/app/segments` | session | save a previewed segment (rule re-validated) |
| `POST /v1/app/segments/:id/run` | session | create a campaign now → approval queue |
| `DELETE /v1/app/segments/:id` | session | delete (refused if campaign history exists) |
| `GET /v1/{app/}counter?phone=` | session or API key | counter card: loyalty + recommendations + pitch |
| `POST /v1/{app/}loyalty/adjust` | session or API key | award/redeem points (balance-guarded) |
| `POST /v1/{app/}direct-message` | session or API key | 1:1 note (kept out of attribution) |
| `GET/POST /v1/app/menu` + item routes | session | catalog CRUD + import-from-history |
