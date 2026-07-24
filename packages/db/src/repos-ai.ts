// Tenant-scoped repos for the AI-native surface: menu catalog, loyalty
// ledger, 1:1 direct messages, counter-card cache, and the co-purchase
// signal query that powers counter recommendations.

import type {
  Channel,
  CounterCard,
  DirectMessage,
  LoyaltyEntry,
  MenuItem,
} from "@hpas/types";
import { query, queryOne } from "./client.js";

// ---------- menu ----------

const mapMenuItem = (r: any): MenuItem => ({
  id: r.id,
  tenantId: r.tenant_id,
  name: r.name,
  category: r.category,
  price: Number(r.price),
  description: r.description,
  tags: r.tags ?? [],
  available: r.available,
  gstRate: r.gst_rate === null || r.gst_rate === undefined ? null : Number(r.gst_rate),
  hsnCode: r.hsn_code ?? null,
  businessUnitIds: r.business_unit_ids ?? [],
  imageUrl: r.image_url ?? null,
  createdAt: r.created_at,
  trackStock: r.track_stock ?? false,
  currentQty: r.current_qty !== undefined && r.current_qty !== null ? Number(r.current_qty) : 0,
  unit: r.unit ?? "unit",
  reorderPoint: r.reorder_point === null || r.reorder_point === undefined ? null : Number(r.reorder_point),
  leadTimeDays: r.lead_time_days === null || r.lead_time_days === undefined ? null : Number(r.lead_time_days),
  lastRestockedAt: r.last_restocked_at ?? null,
});

export async function listMenuItems(
  tenantId: string,
  opts: { businessUnitId?: string } = {}
): Promise<Array<MenuItem & { branchPrice: number | null }>> {
  const rows = await query<any>(
    `SELECT m.*, bp.price AS branch_price
     FROM menu_items m
     LEFT JOIN menu_item_branch_prices bp
       ON bp.tenant_id = m.tenant_id AND bp.menu_item_id = m.id AND bp.business_unit_id = $2
     WHERE m.tenant_id = $1
       AND ($2::text IS NULL OR m.business_unit_ids = '[]'::jsonb OR m.business_unit_ids @> to_jsonb($2::text))
     ORDER BY m.category, m.name`,
    [tenantId, opts.businessUnitId ?? null]
  );
  return rows.map((r) => ({
    ...mapMenuItem(r),
    branchPrice: r.branch_price !== null && r.branch_price !== undefined ? Number(r.branch_price) : null,
  }));
}

/** Sets (or clears, when price is null) a branch's price override for one item. */
export async function upsertMenuItemBranchPrice(
  tenantId: string,
  menuItemId: string,
  businessUnitId: string,
  price: number | null
): Promise<void> {
  if (price === null) {
    await query(
      `DELETE FROM menu_item_branch_prices WHERE tenant_id = $1 AND menu_item_id = $2 AND business_unit_id = $3`,
      [tenantId, menuItemId, businessUnitId]
    );
    return;
  }
  await query(
    `INSERT INTO menu_item_branch_prices (tenant_id, menu_item_id, business_unit_id, price)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (tenant_id, menu_item_id, business_unit_id) DO UPDATE SET price = EXCLUDED.price, updated_at = now()`,
    [tenantId, menuItemId, businessUnitId, price]
  );
}

/** Every branch price override for one item, keyed by business_unit_id. */
export async function menuItemBranchPrices(
  tenantId: string,
  menuItemId: string
): Promise<Record<string, number>> {
  const rows = await query<any>(
    `SELECT business_unit_id, price FROM menu_item_branch_prices WHERE tenant_id = $1 AND menu_item_id = $2`,
    [tenantId, menuItemId]
  );
  return Object.fromEntries(rows.map((r) => [r.business_unit_id, Number(r.price)]));
}

export async function upsertMenuItem(
  tenantId: string,
  item: {
    name: string;
    category: string;
    price: number;
    description?: string | null;
    tags?: string[];
    available?: boolean;
    gstRate?: number | null;
    hsnCode?: string | null;
    businessUnitIds?: string[];
  }
): Promise<MenuItem> {
  const row = await queryOne(
    `INSERT INTO menu_items (tenant_id, name, category, price, description, tags, available, gst_rate, hsn_code, business_unit_ids)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (tenant_id, name) DO UPDATE SET
       category = EXCLUDED.category, price = EXCLUDED.price,
       description = EXCLUDED.description, tags = EXCLUDED.tags,
       available = EXCLUDED.available, gst_rate = EXCLUDED.gst_rate,
       hsn_code = EXCLUDED.hsn_code, business_unit_ids = EXCLUDED.business_unit_ids
     RETURNING *`,
    [
      tenantId,
      item.name,
      item.category,
      item.price,
      item.description ?? null,
      JSON.stringify(item.tags ?? []),
      item.available ?? true,
      item.gstRate ?? null,
      item.hsnCode ?? null,
      JSON.stringify(item.businessUnitIds ?? []),
    ]
  );
  return mapMenuItem(row);
}

/** General field edit by id — used for inline price/category/tag edits from Master Data. */
export async function updateMenuItem(
  tenantId: string,
  itemId: string,
  patch: {
    name?: string;
    category?: string;
    price?: number;
    gstRate?: number | null;
    hsnCode?: string | null;
    businessUnitIds?: string[];
    imageUrl?: string | null;
    tags?: string[];
  }
): Promise<MenuItem | null> {
  const row = await queryOne(
    `UPDATE menu_items SET
       name = coalesce($3, name),
       category = coalesce($4, category),
       price = coalesce($5, price),
       gst_rate = CASE WHEN $6::boolean THEN $7 ELSE gst_rate END,
       hsn_code = CASE WHEN $8::boolean THEN $9 ELSE hsn_code END,
       business_unit_ids = coalesce($10, business_unit_ids),
       image_url = CASE WHEN $11::boolean THEN $12 ELSE image_url END,
       tags = coalesce($13, tags)
     WHERE tenant_id = $1 AND id = $2
     RETURNING *`,
    [
      tenantId,
      itemId,
      patch.name ?? null,
      patch.category ?? null,
      patch.price ?? null,
      "gstRate" in patch,
      patch.gstRate ?? null,
      "hsnCode" in patch,
      patch.hsnCode ?? null,
      patch.businessUnitIds !== undefined ? JSON.stringify(patch.businessUnitIds) : null,
      "imageUrl" in patch,
      patch.imageUrl ?? null,
      patch.tags !== undefined ? JSON.stringify(patch.tags) : null,
    ]
  );
  return row ? mapMenuItem(row) : null;
}

export async function setMenuItemAvailability(
  tenantId: string,
  itemId: string,
  available: boolean
): Promise<void> {
  await query(`UPDATE menu_items SET available = $3 WHERE tenant_id = $1 AND id = $2`, [
    tenantId,
    itemId,
    available,
  ]);
}

export async function deleteMenuItem(tenantId: string, itemId: string): Promise<void> {
  await query(`DELETE FROM menu_items WHERE tenant_id = $1 AND id = $2`, [tenantId, itemId]);
}

/** Applies an AI Pricing recommendation — never automatic, always tenant-invoked. */
export async function updateMenuItemPrice(
  tenantId: string,
  itemId: string,
  price: number
): Promise<MenuItem | null> {
  const row = await queryOne(
    `UPDATE menu_items SET price = $3 WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    [tenantId, itemId, price]
  );
  return row ? mapMenuItem(row) : null;
}

/** Menu items added in the trailing window — "what's new" context for campaign copy. */
export async function recentMenuItems(tenantId: string, days: number): Promise<MenuItem[]> {
  const rows = await query(
    `SELECT * FROM menu_items
     WHERE tenant_id = $1 AND available AND created_at > now() - ($2 || ' days')::interval
     ORDER BY created_at DESC LIMIT 5`,
    [tenantId, String(days)]
  );
  return rows.map(mapMenuItem);
}

/**
 * Cold-start: derive a menu from what the shop has actually sold — distinct
 * items in purchase history with their dominant category and median price.
 */
export async function menuCandidatesFromHistory(
  tenantId: string
): Promise<Array<{ name: string; category: string; price: number; timesSold: number }>> {
  const rows = await query<any>(
    `SELECT item->>'name' AS name,
            mode() WITHIN GROUP (ORDER BY item->>'category') AS category,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY (item->>'unitPrice')::numeric) AS price,
            count(*)::int AS times_sold
     FROM events, jsonb_array_elements(items) AS item
     WHERE tenant_id = $1 AND event_type = 'purchase' AND item->>'name' <> ''
     GROUP BY 1 ORDER BY times_sold DESC`,
    [tenantId]
  );
  return rows.map((r) => ({
    name: r.name,
    category: r.category ?? "uncategorized",
    price: Math.round(Number(r.price ?? 0) * 100) / 100,
    timesSold: r.times_sold,
  }));
}

// ---------- loyalty ledger ----------

const mapLoyalty = (r: any): LoyaltyEntry => ({
  id: r.id,
  tenantId: r.tenant_id,
  profileId: r.profile_id,
  points: r.points,
  reason: r.reason,
  createdAt: r.created_at,
});

export async function addLoyaltyPoints(
  tenantId: string,
  profileId: string,
  points: number,
  reason: string
): Promise<void> {
  if (points === 0) return;
  await query(
    `INSERT INTO loyalty_ledger (tenant_id, profile_id, points, reason) VALUES ($1, $2, $3, $4)`,
    [tenantId, profileId, Math.round(points), reason]
  );
}

export async function loyaltyBalance(tenantId: string, profileId: string): Promise<number> {
  const row = await queryOne<{ balance: string }>(
    `SELECT coalesce(sum(points), 0)::text AS balance
     FROM loyalty_ledger WHERE tenant_id = $1 AND profile_id = $2`,
    [tenantId, profileId]
  );
  return Number(row?.balance ?? 0);
}

export async function loyaltyLedger(
  tenantId: string,
  profileId: string,
  limit = 20
): Promise<LoyaltyEntry[]> {
  const rows = await query(
    `SELECT * FROM loyalty_ledger WHERE tenant_id = $1 AND profile_id = $2
     ORDER BY created_at DESC LIMIT $3`,
    [tenantId, profileId, limit]
  );
  return rows.map(mapLoyalty);
}

export async function loyaltyLedgerIsEmpty(tenantId: string): Promise<boolean> {
  const row = await queryOne(`SELECT 1 FROM loyalty_ledger WHERE tenant_id = $1 LIMIT 1`, [
    tenantId,
  ]);
  return row === null;
}

// ---------- direct (1:1) messages ----------

const mapDirectMessage = (r: any): DirectMessage => ({
  id: r.id,
  tenantId: r.tenant_id,
  profileId: r.profile_id,
  channel: r.channel,
  body: r.body,
  status: r.status,
  sentBy: r.sent_by,
  sentAt: r.sent_at,
});

export async function insertDirectMessage(m: {
  tenantId: string;
  profileId: string;
  channel: Channel;
  body: string;
  status: "sent" | "failed";
  sentBy: string;
}): Promise<DirectMessage> {
  const row = await queryOne(
    `INSERT INTO direct_messages (tenant_id, profile_id, channel, body, status, sent_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [m.tenantId, m.profileId, m.channel, m.body, m.status, m.sentBy]
  );
  return mapDirectMessage(row);
}

export async function directMessagesForProfile(
  tenantId: string,
  profileId: string,
  limit = 10
): Promise<DirectMessage[]> {
  const rows = await query(
    `SELECT * FROM direct_messages WHERE tenant_id = $1 AND profile_id = $2
     ORDER BY sent_at DESC LIMIT $3`,
    [tenantId, profileId, limit]
  );
  return rows.map(mapDirectMessage);
}

// ---------- counter-card cache ----------

export async function getCachedCounterCard(
  tenantId: string,
  profileId: string,
  maxAgeHours: number
): Promise<CounterCard | null> {
  const row = await queryOne<{ payload: CounterCard }>(
    `SELECT payload FROM counter_cards
     WHERE tenant_id = $1 AND profile_id = $2
       AND computed_at > now() - ($3 || ' hours')::interval`,
    [tenantId, profileId, String(maxAgeHours)]
  );
  return row?.payload ?? null;
}

export async function cacheCounterCard(
  tenantId: string,
  profileId: string,
  payload: CounterCard
): Promise<void> {
  await query(
    `INSERT INTO counter_cards (tenant_id, profile_id, payload, computed_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (tenant_id, profile_id)
       DO UPDATE SET payload = EXCLUDED.payload, computed_at = now()`,
    [tenantId, profileId, JSON.stringify(payload)]
  );
}

// ---------- signals for recommendations ----------

export async function getProfileByPhone(
  tenantId: string,
  phone: string
): Promise<{ id: string; phone: string; traits: Record<string, unknown> } | null> {
  const row = await queryOne(
    `SELECT id, phone, traits FROM profiles WHERE tenant_id = $1 AND phone = $2`,
    [tenantId, phone]
  );
  return row ? { id: row.id, phone: row.phone, traits: row.traits } : null;
}

/**
 * Tenant-wide co-purchase pairs: how often two items appear in the same
 * basket. The classic "goes well with" signal, from the shop's own data.
 */
export async function coPurchasePairs(
  tenantId: string,
  minCount = 2
): Promise<Array<{ a: string; b: string; count: number }>> {
  const rows = await query<any>(
    `SELECT i1.item->>'name' AS a, i2.item->>'name' AS b, count(*)::int AS count
     FROM events e,
          LATERAL jsonb_array_elements(e.items) AS i1(item),
          LATERAL jsonb_array_elements(e.items) AS i2(item)
     WHERE e.tenant_id = $1 AND e.event_type = 'purchase'
       AND i1.item->>'name' < i2.item->>'name'
     GROUP BY 1, 2
     HAVING count(*) >= $2
     ORDER BY count DESC`,
    [tenantId, minCount]
  );
  return rows;
}

/** Items a profile has bought, with counts and last-purchase timestamps. */
export async function purchasedItemsForProfile(
  tenantId: string,
  profileId: string
): Promise<Array<{ name: string; category: string; times: number; lastTs: Date }>> {
  const rows = await query<any>(
    `SELECT item->>'name' AS name,
            mode() WITHIN GROUP (ORDER BY item->>'category') AS category,
            count(*)::int AS times,
            max(e.ts) AS last_ts
     FROM events e, jsonb_array_elements(e.items) AS item
     WHERE e.tenant_id = $1 AND e.profile_id = $2 AND e.event_type = 'purchase'
       AND item->>'name' <> ''
     GROUP BY 1 ORDER BY times DESC`,
    [tenantId, profileId]
  );
  return rows.map((r) => ({
    name: r.name,
    category: r.category ?? "uncategorized",
    times: r.times,
    lastTs: r.last_ts,
  }));
}

/** Aggregate, PII-free stats snapshot used by AI segment discovery. */
export async function segmentDiscoveryStats(tenantId: string): Promise<{
  totalProfiles: number;
  recencyBuckets: Record<string, number>;
  categorySpend: Array<{ category: string; revenue: number; buyers: number }>;
  festivalBuyers: number;
  withCadence: number;
  ltvQuartiles: number[];
}> {
  const [buckets, cats, misc, quartiles] = await Promise.all([
    query<any>(
      `SELECT CASE
                WHEN recency_days <= 30 THEN '0-30'
                WHEN recency_days <= 60 THEN '31-60'
                WHEN recency_days <= 90 THEN '61-90'
                WHEN recency_days <= 180 THEN '91-180'
                ELSE '180+' END AS bucket,
              count(*)::int AS n
       FROM features WHERE tenant_id = $1 GROUP BY 1`,
      [tenantId]
    ),
    query<any>(
      `SELECT item->>'category' AS category,
              round(sum((item->>'qty')::numeric * (item->>'unitPrice')::numeric))::int AS revenue,
              count(DISTINCT e.profile_id)::int AS buyers
       FROM events e, jsonb_array_elements(e.items) AS item
       WHERE e.tenant_id = $1 AND e.event_type = 'purchase'
       GROUP BY 1 ORDER BY revenue DESC LIMIT 8`,
      [tenantId]
    ),
    queryOne<any>(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE festival_buyer)::int AS festival,
              count(*) FILTER (WHERE reorder_cadence_days IS NOT NULL)::int AS cadence
       FROM features WHERE tenant_id = $1`,
      [tenantId]
    ),
    query<any>(
      `SELECT percentile_cont(ARRAY[0.25, 0.5, 0.75, 0.9]) WITHIN GROUP (ORDER BY monetary_ltv) AS q
       FROM features WHERE tenant_id = $1`,
      [tenantId]
    ),
  ]);

  return {
    totalProfiles: misc?.total ?? 0,
    recencyBuckets: Object.fromEntries(buckets.map((b: any) => [b.bucket, b.n])),
    categorySpend: cats.map((c: any) => ({
      category: c.category,
      revenue: c.revenue,
      buyers: c.buyers,
    })),
    festivalBuyers: misc?.festival ?? 0,
    withCadence: misc?.cadence ?? 0,
    ltvQuartiles: (quartiles[0]?.q ?? []).map((v: unknown) => Math.round(Number(v))),
  };
}
