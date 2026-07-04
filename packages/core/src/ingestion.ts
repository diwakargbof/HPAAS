// Both ingestion paths (CSV batch + streaming API) funnel through
// ingestNormalizedEvents, so profile upsert and event append behavior
// is identical regardless of where data enters.

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import type {
  EventItem,
  NormalizedEvent,
  PosColumnMapping,
  ProfileTraits,
  Tenant,
} from "@hpas/types";
import { addWhatsappOptIn, insertEvent, upsertProfile } from "@hpas/db";
import { normalizePhone } from "./phone.js";
import { awardPurchasePoints } from "./loyalty.js";

dayjs.extend(customParseFormat);

export interface RowError {
  rowNumber: number;
  reason: string;
}

export interface CsvParseResult {
  events: NormalizedEvent[];
  errors: RowError[];
}

/**
 * Turn a tenant's POS CSV (already parsed to header→value records) into
 * normalized events using the tenant's posColumnMapping. Pure function —
 * no DB access — so it's unit-testable per tenant config.
 */
export function mapCsvRows(
  tenantId: string,
  rows: Array<Record<string, string>>,
  mapping: PosColumnMapping
): CsvParseResult {
  const events: NormalizedEvent[] = [];
  const errors: RowError[] = [];

  rows.forEach((row, i) => {
    const rowNumber = i + 2; // header is row 1
    const phone = normalizePhone(row[mapping.phone] ?? "");
    if (!phone) {
      errors.push({ rowNumber, reason: `invalid phone: "${row[mapping.phone] ?? ""}"` });
      return;
    }

    const ts = dayjs(row[mapping.timestamp] ?? "", mapping.dateFormat, true);
    if (!ts.isValid()) {
      errors.push({
        rowNumber,
        reason: `invalid date "${row[mapping.timestamp] ?? ""}" (expected ${mapping.dateFormat})`,
      });
      return;
    }

    const amount = parseFloat((row[mapping.amount] ?? "").replace(/[₹,\s]/g, ""));
    if (Number.isNaN(amount)) {
      errors.push({ rowNumber, reason: `invalid amount: "${row[mapping.amount] ?? ""}"` });
      return;
    }

    const items = parseItemsCell(row[mapping.items] ?? "", mapping);

    const traits: ProfileTraits = {};
    if (mapping.name && row[mapping.name]) traits.name = row[mapping.name];
    if (mapping.email && row[mapping.email]) traits.email = row[mapping.email];

    events.push({
      tenantId,
      phone,
      traits,
      locationId: mapping.locationId ? row[mapping.locationId] || undefined : undefined,
      eventType: "purchase",
      items,
      amount,
      ts: ts.toDate(),
    });
  });

  return { events, errors };
}

function parseItemsCell(cell: string, mapping: PosColumnMapping): EventItem[] {
  if (!cell) return [];
  const fieldOrder = mapping.itemFormat.split("|");
  return cell
    .split(mapping.itemsDelimiter)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(mapping.itemPartsDelimiter).map((p) => p.trim());
      const get = (f: string) => parts[fieldOrder.indexOf(f)] ?? "";
      return {
        name: get("name"),
        category: get("category") || "uncategorized",
        qty: parseFloat(get("qty")) || 1,
        unitPrice: parseFloat(get("unitPrice")) || 0,
      };
    })
    .filter((it) => it.name.length > 0);
}

/**
 * Write normalized events: upsert profile by (tenant, phone), append event.
 * Purchases also record a WhatsApp opt-in (source "pos_import") — documented
 * assumption: an existing customer relationship from the POS counts as
 * opt-in for the pilot; replace with explicit opt-in collection for scale.
 */
export async function ingestNormalizedEvents(
  tenant: Tenant,
  events: NormalizedEvent[]
): Promise<{ processed: number }> {
  let processed = 0;
  for (const e of events) {
    const profile = await upsertProfile(tenant.id, e.phone, e.traits ?? {});
    await insertEvent(tenant.id, profile.id, e);
    if (e.eventType === "purchase") {
      await addWhatsappOptIn(tenant.id, e.phone, "pos_import");
      // Loyalty earn lives in ingestion so points can never drift from the
      // events table, whichever path (CSV or streaming) the purchase took.
      await awardPurchasePoints(tenant, profile.id, e.amount);
    }
    processed++;
  }
  return { processed };
}

/**
 * The streaming-endpoint payload (Identify/Track style). tenant comes from
 * the API key, never from the body.
 */
export interface TrackPayload {
  phone: string;
  event_type?: string;
  name?: string;
  email?: string;
  location_id?: string;
  items?: Array<Partial<EventItem>>;
  amount?: number;
  ts?: string;
}

export function normalizeTrackPayload(
  tenantId: string,
  body: TrackPayload
): { event: NormalizedEvent } | { error: string } {
  const phone = normalizePhone(body.phone ?? "");
  if (!phone) return { error: `invalid phone: "${body.phone ?? ""}"` };

  const ts = body.ts ? dayjs(body.ts) : dayjs();
  if (!ts.isValid()) return { error: `invalid ts: "${body.ts}"` };

  const eventType = (body.event_type ?? "purchase") as NormalizedEvent["eventType"];
  const traits: ProfileTraits = {};
  if (body.name) traits.name = body.name;
  if (body.email) traits.email = body.email;

  return {
    event: {
      tenantId,
      phone,
      traits,
      locationId: body.location_id,
      eventType,
      items: (body.items ?? []).map((it) => ({
        name: it.name ?? "",
        category: it.category ?? "uncategorized",
        qty: it.qty ?? 1,
        unitPrice: it.unitPrice ?? 0,
      })),
      amount: body.amount ?? 0,
      ts: ts.toDate(),
    },
  };
}
