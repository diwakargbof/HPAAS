// The Express app itself — no listen() call here, so it can be reused by
// both the persistent-host entrypoint (src/index.ts) and the Vercel
// serverless entrypoint (api/index.ts), which just exports this app as a
// request handler.

import express from "express";
import cors from "cors";
import { apiKeyAuth, loginHandler, sessionAuth } from "./auth.js";
import { ingestRouter } from "./routes/ingest.js";
import { appRouter } from "./routes/app.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { redemptionsRouter } from "./routes/redemptions.js";
import { segmentsRouter } from "./routes/segments.js";
import { counterRouter } from "./routes/counter.js";
import { menuRouter } from "./routes/menu.js";
import { qrOrdersRouter, qrPublicRouter } from "./routes/qr-orders.js";
import { billingRouter, invoicesPublicRouter } from "./routes/billing.js";
import { pricingRouter } from "./routes/pricing.js";

export const app: express.Express = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Root: a browser hitting the bare API host should see what this is, not
// Express's default "Cannot GET /".
app.get("/", (_req, res) =>
  res.json({
    service: "HPAS API",
    status: "ok",
    docs: "machine API under /v1 (X-API-Key), dashboard API under /v1/app (Bearer)",
    health: "/health",
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/v1/auth/login", loginHandler);

// WhatsApp webhooks (Meta calls these; verified via token/signature, not API key).
app.use("/v1/webhooks", webhooksRouter);

// Public QR claim surface (customer phones hit this from the printed QR;
// the unguessable per-order token is the credential).
app.use("/q", qrPublicRouter);

// Public printable GST invoice (same unguessable-token-is-the-credential
// pattern as the QR claim surface above).
app.use("/i", invoicesPublicRouter);

// Dashboard (session auth). Includes CSV upload via the shared ingest routes.
app.use("/v1/app", sessionAuth, appRouter);
app.use("/v1/app", sessionAuth, ingestRouter);
app.use("/v1/app", sessionAuth, segmentsRouter);
app.use("/v1/app", sessionAuth, counterRouter);
app.use("/v1/app", sessionAuth, menuRouter);
app.use("/v1/app", sessionAuth, qrOrdersRouter);
app.use("/v1/app", sessionAuth, billingRouter);
app.use("/v1/app", sessionAuth, pricingRouter);

// Machine API (API-key auth): streaming events, uploads, POS redemptions,
// the counter card (so billing software can show it at checkout and
// award/redeem points from the till), and per-order QR creation for
// aggregator-order capture.
app.use("/v1", apiKeyAuth, ingestRouter);
app.use("/v1", apiKeyAuth, redemptionsRouter);
app.use("/v1", apiKeyAuth, counterRouter);
app.use("/v1", apiKeyAuth, qrOrdersRouter);
