import express from "express";
import cors from "cors";
import { apiKeyAuth, loginHandler, sessionAuth } from "./auth.js";
import { ingestRouter } from "./routes/ingest.js";
import { appRouter } from "./routes/app.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { redemptionsRouter } from "./routes/redemptions.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/v1/auth/login", loginHandler);

// WhatsApp webhooks (Meta calls these; verified via token/signature, not API key).
app.use("/v1/webhooks", webhooksRouter);

// Dashboard (session auth). Includes CSV upload via the shared ingest routes.
app.use("/v1/app", sessionAuth, appRouter);
app.use("/v1/app", sessionAuth, ingestRouter);

// Machine API (API-key auth): streaming events, uploads, POS redemptions.
app.use("/v1", apiKeyAuth, ingestRouter);
app.use("/v1", apiKeyAuth, redemptionsRouter);

const port = Number(process.env.API_PORT ?? 4000);
app.listen(port, () => console.log(`hpas api listening on :${port}`));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on("unhandledRejection", (err: any) => console.error("unhandledRejection", err));
