# Deploying HPAS: Supabase + Vercel

This deploys the whole stack to Vercel: the dashboard as a standard Next.js
project, and the API as Vercel Serverless Functions with Vercel Cron
replacing the persistent `node-cron` worker. Database is Supabase Postgres.

**Prerequisites**
- A [Supabase](https://supabase.com) account (free tier is fine for the pilot)
- A [Vercel](https://vercel.com) account connected to the GitHub account
  that owns this repo
- Locally: Node 22+, pnpm 9 (`npm i -g pnpm@9`) — needed once, to run
  migrations and seed against Supabase

Two separate Vercel projects, same GitHub repo, different **Root Directory**:

| Project | Root Directory | What it is |
|---|---|---|
| `hpas-api` | `apps/api` | Express app wrapped as serverless functions + cron |
| `hpas-dashboard` | `apps/dashboard` | Next.js shop-owner app |

`apps/worker`'s `node-cron` scheduler (`pnpm dev:worker`) is **not used** on
this path — its logic now lives in `packages/jobs`, shared with the two
Vercel Cron endpoints in `apps/api/api/cron/`. Keep `apps/worker` around if
you ever want to self-host on a persistent box instead (Railway/Render/Fly);
nothing here breaks that option.

---

## 1. Supabase — database

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string** — you need two:
   - **Transaction pooler** (port `6543`, has `?pgbouncer=true`) → this is
     your app's `DATABASE_URL`. Serverless functions open many short-lived
     connections; the pooler keeps that from exhausting Postgres.
   - **Direct connection** (port `5432`) → this is `DIRECT_DATABASE_URL`,
     used only for running migrations (DDL doesn't always work cleanly
     through a transaction-mode pooler).
3. Run migrations and seed **from your local machine**, pointed at Supabase:

   ```bash
   # .env (local, temporary — just for this one step)
   DATABASE_URL=<supabase transaction-pooler string>
   DIRECT_DATABASE_URL=<supabase direct connection string>

   pnpm install
   pnpm db:migrate      # applies migrations 001-003; uses DIRECT_DATABASE_URL
   pnpm db:seed         # uses DATABASE_URL
   ```

   The seed is idempotent and gives you a fully working pilot: the Dadu's
   tenant, 186 mock POS rows (55 customers), computed features, the four
   standard segments, loyalty points backfilled for every customer, a
   22-item menu imported from sales history, and one campaign per segment
   type waiting in the approval queue.

   `packages/db/src/client.ts` auto-detects Supabase hosts and enables TLS;
   you don't need to add `sslmode=require` yourself.

---

## 2. Vercel — API project (`hpas-api`)

1. **New Project** → import the repo → **Root Directory: `apps/api`**.
   Vercel auto-detects the pnpm workspace root (via `pnpm-lock.yaml` and
   `pnpm-workspace.yaml`) and runs `pnpm install` from there — no custom
   install command needed. **Framework Preset: Other** (this project is
   pure serverless functions, no static build step).
2. **Environment Variables** (Project Settings → Environment Variables):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Supabase transaction-pooler string |
   | `AUTH_SECRET` | a random secret (`openssl rand -hex 32`) |
   | `DEMO_PASSWORD` | your dashboard login password |
   | `CRON_SECRET` | a random secret — **required**, see below |
   | `ANTHROPIC_API_KEY` | recommended — powers all four AI features (campaign copy, the natural-language segment builder, segment discovery, counter pitch lines). Omit and a deterministic mock provider serves all four, so the app still works end to end |
   | `ANTHROPIC_MODEL` | `claude-opus-4-8` |
   | `WHATSAPP_MODE` | `stub` (until Meta BSP approval lands) |
   | `EMAIL_MODE` | `stub` or `resend` (+ `RESEND_API_KEY`) |

   `CRON_SECRET` is what authorizes Vercel Cron to call `/api/cron/*` —
   Vercel automatically sends it as `Authorization: Bearer $CRON_SECRET` on
   scheduled invocations. Without it set, every cron request is rejected
   (fails closed, not open).
3. Deploy. `apps/api/vercel.json` wires up:
   - a catch-all rewrite so the Express app (`apps/api/src/app.ts`) serves
     every request that isn't a dedicated function under `/api/*`
   - two cron schedules:

     ```jsonc
     { "path": "/api/cron/nightly",     "schedule": "30 20 * * *" } // 02:00 IST — features + triggers
     { "path": "/api/cron/maintenance", "schedule": "30 21 * * *" } // 03:30 IST — send safety-net + email fallback
     ```

     **Vercel Hobby plan caps cron at 2 jobs, once daily each** — that's
     exactly what's configured. If you're on **Pro**, you can split these
     into the original finer-grained schedule (features nightly, triggers
     right after, a 5-minute send safety-net, hourly email fallback) by
     adding two more `api/cron/*.ts` files (`send-campaigns.ts` alone,
     `email-fallback.ts` alone — the job functions already exist in
     `@hpas/jobs`, just call them individually) and updating `crons` in
     `vercel.json` accordingly.
   - Note: approving a campaign in the dashboard sends immediately from the
     request handler — the cron jobs are a safety net and nightly automation,
     not the primary send path.
4. Note the deployment URL (e.g. `https://hpas-api.vercel.app`) — the
   dashboard needs it next.

---

## 3. Vercel — dashboard project (`hpas-dashboard`)

1. **New Project** → import the same repo → **Root Directory:
   `apps/dashboard`**. Framework Preset: Next.js (auto-detected).
2. **Environment Variables:**

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | the API project's URL from step 2.4 |

3. Deploy. Log in with the shop id you seeded (`dadus`) and the
   `DEMO_PASSWORD` you set on the API project.

---

## 4. Verify the deployment

Work through this once, in order (replace the URLs with your own):

1. **API up**: `https://hpas-api.vercel.app/health` returns `{"ok":true}`.
2. **Login**: open the dashboard URL, sign in with `dadus` + your
   `DEMO_PASSWORD`. You should land on *My Customers* with real numbers
   (55 customers), not zeros.
3. **Approval queue**: *Campaigns* shows pending campaigns with per-customer
   sample messages. Approve one — it should report sent counts immediately
   (WhatsApp is in stub mode, so sends are recorded, not transmitted).
4. **Counter**: *Counter* page → look up `98260 10705` (a seeded customer).
   You should get her card: loyalty balance, 2-3 recommendations with
   prices, and a pitch line.
5. **AI segments**: *Segments* → type "customers who spend a lot but
   haven't visited in 45 days" → *Preview audience* should return a rule
   and a live count.
6. **Cron auth**: `curl https://hpas-api.vercel.app/api/cron/nightly`
   (no header) must return `401` — that's the `CRON_SECRET` guard working.
   The scheduled runs themselves show up under the API project's
   **Deployments → Functions** logs after their first firing.

## Keeping it updated

- **Code**: every push to `main` auto-deploys both Vercel projects
  (that's Vercel's default Git integration — nothing to configure).
- **Schema changes**: Vercel never runs migrations. When a commit adds a
  file to `packages/db/migrations/`, run `pnpm db:migrate` from your
  machine against Supabase (same two-variable `.env` as step 1.3) around
  the time you push. The migration runner is idempotent — already-applied
  files are skipped.
- **New tenant**: add `tenants/<slug>/config.json` locally, run
  `pnpm db:seed --tenant <slug>` against Supabase, push. No deploy-side
  changes needed.

---

## Known constraints of this deployment shape

- **Request body size**: Vercel Serverless Functions cap request bodies at
  4.5 MB. The demo CSV (186 rows) is a few KB and fine; a shop with a much
  larger POS export could hit this. If that happens, the fix is to accept
  the upload via a pre-signed storage URL rather than posting the file
  through the function — not needed at pilot scale.
- **Function execution time**: feature computation and trigger evaluation
  run inside a single serverless invocation. Fine for a handful of tenants
  at hundreds of profiles each (as built); if a tenant's profile count grows
  into the tens of thousands, either raise `maxDuration` in
  `apps/api/vercel.json` (Pro plan) or split `compute-features`/
  `evaluate-triggers` per-tenant across multiple cron-triggered calls.
- **Cron cadence on Hobby**: as noted above, capped at 2 daily jobs. The
  send safety-net and email fallback checking only once a day (instead of
  every 5 minutes / hourly) is a minor latency increase, not a correctness
  issue — approvals still send immediately, and the 48h WhatsApp→email
  fallback window is still comfortably met.
- **First deploy**: this is a pnpm-workspace monorepo with internal packages
  consumed as TypeScript source (not pre-built to `dist/`). Vercel's Node.js
  builder bundles each function's dependency graph automatically and this
  pattern is well-trodden, but it hasn't been deployed against a live Vercel
  account as part of this build — watch the first deploy's build logs for
  module-resolution errors. If one appears, the usual fix is adding a
  `functions.<path>.includeFiles` entry in `vercel.json` for whatever file
  the bundler didn't trace (commonly needed for JSON files read via
  `fs.readFileSync`, which `tenants/*/config.json` isn't relevant to here
  since that logic only runs in `apps/worker`'s seed script, not the API).

## Local development is unaffected

Nothing above changes the local workflow — `DATABASE_URL` pointed at a local
Postgres, `pnpm dev:api` (persistent Express + `app.listen`), and
`pnpm dev:worker` (persistent `node-cron`) all still work exactly as before.
See the main [README.md](./README.md) for that path.
