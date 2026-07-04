import express from "express";
import cors from "cors";
import { apiKeyAuth, loginHandler, sessionAuth } from "./auth.js";
import { ingestRouter } from "./routes/ingest.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/v1/auth/login", loginHandler);

// Machine ingestion (POS → HPAS): API-key auth.
app.use("/v1", apiKeyAuth, ingestRouter);

// Dashboard routes (session auth) are mounted under /v1/app.
export const appRouter: import("express").Router = express.Router();
app.use("/v1/app", sessionAuth, appRouter);

// Dashboard file uploads reuse the same ingestion handlers with session auth.
appRouter.use("/", ingestRouter);

const port = Number(process.env.API_PORT ?? 4000);
app.listen(port, () => console.log(`hpas api listening on :${port}`));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on("unhandledRejection", (err: any) => console.error("unhandledRejection", err));
