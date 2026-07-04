import { Router } from "express";
import multer from "multer";
import {
  ingestNormalizedEvents,
  mapCsvRows,
  normalizeTrackPayload,
  parseCsv,
  type TrackPayload,
} from "@hpas/core";
import { createUpload, finishUpload, listUploads } from "@hpas/db";

export const ingestRouter: import("express").Router = Router();

/**
 * Streaming ingestion: POST /v1/events with an Identify/Track-style payload
 * (single object or array). Tenant comes from the API key, never the body.
 */
ingestRouter.post("/events", async (req, res) => {
  const tenant = req.tenant!;
  const bodies: TrackPayload[] = Array.isArray(req.body) ? req.body : [req.body];
  if (bodies.length === 0 || bodies.length > 500) {
    res.status(400).json({ error: "expected 1-500 events" });
    return;
  }

  const events: import("@hpas/types").NormalizedEvent[] = [];
  const errors: Array<{ index: number; error: string }> = [];
  bodies.forEach((body, index) => {
    const result = normalizeTrackPayload(tenant.id, body);
    if ("error" in result) errors.push({ index, error: result.error });
    else events.push(result.event);
  });

  const { processed } = await ingestNormalizedEvents(tenant, events);
  res.status(errors.length && !processed ? 400 : 200).json({ processed, errors });
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * Batch ingestion: POST /v1/uploads (multipart, field "file") — parses the
 * CSV with the tenant's posColumnMapping, same downstream writes as /events.
 */
ingestRouter.post("/uploads", upload.single("file"), async (req, res) => {
  const tenant = req.tenant!;
  if (!req.file) {
    res.status(400).json({ error: 'missing multipart file field "file"' });
    return;
  }

  const uploadRow = await createUpload(tenant.id, req.file.originalname);
  try {
    const rows = parseCsv(req.file.buffer.toString("utf8"));
    const { events, errors } = mapCsvRows(tenant.id, rows, tenant.config.posColumnMapping);
    const { processed } = await ingestNormalizedEvents(tenant, events);
    const errorLog = errors.length
      ? errors.map((e) => `row ${e.rowNumber}: ${e.reason}`).join("\n")
      : null;
    const status = processed > 0 ? "success" : "error";
    await finishUpload(tenant.id, uploadRow.id, status, processed, errorLog);
    res.json({ uploadId: uploadRow.id, status, rowsProcessed: processed, rowErrors: errors });
  } catch (err) {
    await finishUpload(tenant.id, uploadRow.id, "error", 0, String(err));
    res.status(500).json({ uploadId: uploadRow.id, status: "error", error: String(err) });
  }
});

ingestRouter.get("/uploads", async (req, res) => {
  res.json({ uploads: await listUploads(req.tenant!.id) });
});
