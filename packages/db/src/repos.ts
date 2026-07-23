// Typed, tenant-scoped query layer. Every function that touches business
// data takes tenantId (or an id already resolved through a tenant-scoped
// lookup). There is deliberately no "query all tenants" helper for
// business tables — cross-tenant access is a bug by construction.

import type {
  AttributionReport,
  Campaign,
  CampaignStatus,
  CampaignType,
  Channel,
  EventItem,
  EventRow,
  Features,
  GeneratedCopy,
  Message,
  MessageStatus,
  NormalizedEvent,
  Preference,
  Profile,
  ProfileTraits,
  Segment,
  SegmentRule,
  SegmentSource,
  Tenant,
  TenantConfig,
  Upload,
  UploadStatus,
} from "@hpas/types";
import { query, queryOne, withTransaction } from "./client.js";

// ---------- row mappers ----------

const mapTenant = (r: any): Tenant => ({
  id: r.id,
  name: r.name,
  config: r.config,
  whatsappNumber: r.whatsapp_number,
  apiKey: r.api_key,
  createdAt: r.created_at,
});

const mapProfile = (r: any): Profile => ({
  id: r.id,
  tenantId: r.tenant_id,
  phone: r.phone,
  traits: r.traits,
  createdAt: r.created_at,
});

const mapEvent = (r: any): EventRow => ({
  id: r.id,
  tenantId: r.tenant_id,
  profileId: r.profile_id,
  locationId: r.location_id,
  eventType: r.event_type,
  items: r.items,
  amount: Number(r.amount),
  ts: r.ts,
});

const mapFeatures = (r: any): Features => ({
  profileId: r.profile_id,
  tenantId: r.tenant_id,
  recencyDays: r.recency_days,
  frequency90d: r.frequency_90d,
  monetaryLtv: Number(r.monetary_ltv),
  categoryAffinity: r.category_affinity,
  festivalBuyer: r.festival_buyer,
  lastFestivalBasket: r.last_festival_basket,
  reorderCadenceDays: r.reorder_cadence_days,
  favoriteItem: r.favorite_item,
  computedAt: r.computed_at,
});

const mapSegment = (r: any): Segment => ({
  id: r.id,
  tenantId: r.tenant_id,
  name: r.name,
  rule: r.rule,
  campaignType: r.campaign_type,
  description: r.description ?? null,
  source: r.source ?? 'standard',
});

const mapCampaign = (r: any): Campaign => ({
  id: r.id,
  tenantId: r.tenant_id,
  segmentId: r.segment_id,
  status: r.status,
  generatedCopy: r.generated_copy,
  audienceSize: r.audience_size,
  createdAt: r.created_at,
  approvedAt: r.approved_at,
  approvedBy: r.approved_by,
  callListCsv: r.call_list_csv,
});

const mapMessage = (r: any): Message => ({
  id: r.id,
  campaignId: r.campaign_id,
  profileId: r.profile_id,
  channel: r.channel,
  renderedText: r.rendered_text,
  status: r.status,
  isControl: r.is_control,
  redemptionCode: r.redemption_code,
  sentAt: r.sent_at,
});

const mapUpload = (r: any): Upload => ({
  id: r.id,
  tenantId: r.tenant_id,
  filename: r.filename,
  status: r.status,
  rowsProcessed: r.rows_processed,
  errorLog: r.error_log,
  uploadedAt: r.uploaded_at,
});

// ---------- tenants ----------

export async function createTenant(input: {
  name: string;
  slug: string;
  config: TenantConfig;
  whatsappNumber: string;
  apiKey: string;
}): Promise<Tenant> {
  const row = await queryOne(
    `INSERT INTO tenants (name, slug, config, whatsapp_number, api_key)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (slug) DO UPDATE
       SET name = EXCLUDED.name, config = EXCLUDED.config,
           whatsapp_number = EXCLUDED.whatsapp_number
     RETURNING *`,
    [input.name, input.slug, JSON.stringify(input.config), input.whatsappNumber, input.apiKey]
  );
  return mapTenant(row);
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const row = await queryOne(`SELECT * FROM tenants WHERE slug = $1`, [slug]);
  return row ? mapTenant(row) : null;
}

export async function getTenantByApiKey(apiKey: string): Promise<Tenant | null> {
  const row = await queryOne(`SELECT * FROM tenants WHERE api_key = $1`, [apiKey]);
  return row ? mapTenant(row) : null;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const row = await queryOne(`SELECT * FROM tenants WHERE id = $1`, [id]);
  return row ? mapTenant(row) : null;
}

export async function listTenants(): Promise<Tenant[]> {
  return (await query(`SELECT * FROM tenants ORDER BY created_at`)).map(mapTenant);
}

// ---------- profiles ----------

export async function upsertProfile(
  tenantId: string,
  phone: string,
  traits: ProfileTraits
): Promise<Profile> {
  const row = await queryOne(
    `INSERT INTO profiles (tenant_id, phone, traits)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, phone)
       DO UPDATE SET traits = profiles.traits || EXCLUDED.traits
     RETURNING *`,
    [tenantId, phone, JSON.stringify(traits)]
  );
  return mapProfile(row);
}

export async function getProfile(tenantId: string, profileId: string): Promise<Profile | null> {
  const row = await queryOne(
    `SELECT * FROM profiles WHERE tenant_id = $1 AND id = $2`,
    [tenantId, profileId]
  );
  return row ? mapProfile(row) : null;
}

export async function getProfilesByIds(tenantId: string, ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return [];
  const rows = await query(
    `SELECT * FROM profiles WHERE tenant_id = $1 AND id = ANY($2::uuid[])`,
    [tenantId, ids]
  );
  return rows.map(mapProfile);
}

export async function listProfileIds(tenantId: string): Promise<string[]> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM profiles WHERE tenant_id = $1`,
    [tenantId]
  );
  return rows.map((r) => r.id);
}

export async function countProfiles(tenantId: string): Promise<number> {
  const row = await queryOne<{ n: string }>(
    `SELECT count(*)::text AS n FROM profiles WHERE tenant_id = $1`,
    [tenantId]
  );
  return Number(row?.n ?? 0);
}

// ---------- events (append-only) ----------

export async function insertEvent(
  tenantId: string,
  profileId: string,
  e: Pick<NormalizedEvent, "eventType" | "items" | "amount" | "ts" | "locationId">
): Promise<void> {
  await query(
    `INSERT INTO events (tenant_id, profile_id, location_id, event_type, items, amount, ts)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [tenantId, profileId, e.locationId ?? null, e.eventType, JSON.stringify(e.items), e.amount, e.ts]
  );
}

export async function eventsForProfile(tenantId: string, profileId: string): Promise<EventRow[]> {
  const rows = await query(
    `SELECT * FROM events WHERE tenant_id = $1 AND profile_id = $2 ORDER BY ts ASC`,
    [tenantId, profileId]
  );
  return rows.map(mapEvent);
}

export async function purchaseEventsByProfile(tenantId: string): Promise<Map<string, EventRow[]>> {
  const rows = await query(
    `SELECT * FROM events WHERE tenant_id = $1 AND event_type = 'purchase' ORDER BY profile_id, ts ASC`,
    [tenantId]
  );
  const byProfile = new Map<string, EventRow[]>();
  for (const r of rows) {
    const e = mapEvent(r);
    const list = byProfile.get(e.profileId) ?? [];
    list.push(e);
    byProfile.set(e.profileId, list);
  }
  return byProfile;
}

export async function purchasesSince(
  tenantId: string,
  profileIds: string[],
  since: Date
): Promise<Map<string, { count: number; revenue: number }>> {
  if (profileIds.length === 0) return new Map();
  const rows = await query<{ profile_id: string; n: string; revenue: string }>(
    `SELECT profile_id, count(*)::text AS n, coalesce(sum(amount),0)::text AS revenue
     FROM events
     WHERE tenant_id = $1 AND profile_id = ANY($2::uuid[])
       AND event_type = 'purchase' AND ts >= $3
     GROUP BY profile_id`,
    [tenantId, profileIds, since]
  );
  return new Map(rows.map((r) => [r.profile_id, { count: Number(r.n), revenue: Number(r.revenue) }]));
}

// ---------- features ----------

export async function upsertFeatures(f: Omit<Features, "computedAt">): Promise<void> {
  await query(
    `INSERT INTO features (profile_id, tenant_id, recency_days, frequency_90d, monetary_ltv,
       category_affinity, festival_buyer, last_festival_basket, reorder_cadence_days,
       favorite_item, computed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
     ON CONFLICT (profile_id) DO UPDATE SET
       recency_days = EXCLUDED.recency_days,
       frequency_90d = EXCLUDED.frequency_90d,
       monetary_ltv = EXCLUDED.monetary_ltv,
       category_affinity = EXCLUDED.category_affinity,
       festival_buyer = EXCLUDED.festival_buyer,
       last_festival_basket = EXCLUDED.last_festival_basket,
       reorder_cadence_days = EXCLUDED.reorder_cadence_days,
       favorite_item = EXCLUDED.favorite_item,
       computed_at = now()`,
    [
      f.profileId,
      f.tenantId,
      f.recencyDays,
      f.frequency90d,
      f.monetaryLtv,
      f.categoryAffinity,
      f.festivalBuyer,
      f.lastFestivalBasket ? JSON.stringify(f.lastFestivalBasket) : null,
      f.reorderCadenceDays,
      f.favoriteItem,
    ]
  );
}

/**
 * Audience selection: run a compiled rule (whereSql + params built by
 * @hpas/core from a whitelisted column/operator set) against features.
 * $1 is always tenant_id; rule params start at $2.
 */
export async function selectAudience(
  tenantId: string,
  whereSql: string,
  params: unknown[]
): Promise<Features[]> {
  const rows = await query(
    `SELECT * FROM features WHERE tenant_id = $1 ${whereSql ? `AND (${whereSql})` : ""}`,
    [tenantId, ...params]
  );
  return rows.map(mapFeatures);
}

export async function getFeaturesForProfiles(
  tenantId: string,
  profileIds: string[]
): Promise<Features[]> {
  if (profileIds.length === 0) return [];
  const rows = await query(
    `SELECT * FROM features WHERE tenant_id = $1 AND profile_id = ANY($2::uuid[])`,
    [tenantId, profileIds]
  );
  return rows.map(mapFeatures);
}

export async function featureStats(tenantId: string): Promise<{
  total: number;
  active: number;
  lapsed: number;
  avgLtv: number;
}> {
  const row = await queryOne<any>(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE recency_days <= 60)::int AS active,
            count(*) FILTER (WHERE recency_days > 60)::int AS lapsed,
            coalesce(avg(monetary_ltv), 0)::float AS avg_ltv
     FROM features WHERE tenant_id = $1`,
    [tenantId]
  );
  return {
    total: row?.total ?? 0,
    active: row?.active ?? 0,
    lapsed: row?.lapsed ?? 0,
    avgLtv: row?.avg_ltv ?? 0,
  };
}

export async function topProfilesByLtv(
  tenantId: string,
  limit: number
): Promise<Array<Features & { phone: string; traits: ProfileTraits }>> {
  const rows = await query(
    `SELECT f.*, p.phone, p.traits
     FROM features f JOIN profiles p ON p.id = f.profile_id AND p.tenant_id = f.tenant_id
     WHERE f.tenant_id = $1
     ORDER BY f.monetary_ltv DESC LIMIT $2`,
    [tenantId, limit]
  );
  return rows.map((r) => ({ ...mapFeatures(r), phone: r.phone, traits: r.traits }));
}

export type CustomerSort = "recent" | "ltv" | "purchases" | "alphabetical";

const CUSTOMER_ORDER_BY: Record<CustomerSort, string> = {
  recent: "p.created_at DESC",
  ltv: "f.monetary_ltv DESC NULLS LAST, p.created_at DESC",
  purchases: "f.frequency_90d DESC NULLS LAST, p.created_at DESC",
  alphabetical: "lower(p.traits->>'name') ASC NULLS LAST, p.phone ASC",
};

/** Every customer (not just the top-N), searchable by name/phone, sortable a few ways. */
export async function listCustomers(
  tenantId: string,
  opts: { search?: string; sort?: CustomerSort; limit?: number; businessUnitId?: string } = {}
): Promise<
  Array<
    Profile & {
      ltv: number | null;
      purchases90d: number | null;
      recencyDays: number | null;
      favoriteItem: string | null;
    }
  >
> {
  const search = opts.search?.trim() || null;
  const limit = opts.limit ?? 500;
  const orderBy = CUSTOMER_ORDER_BY[opts.sort ?? "recent"];

  const rows = await query(
    `SELECT p.*, f.monetary_ltv, f.frequency_90d, f.recency_days, f.favorite_item
     FROM profiles p
     LEFT JOIN features f ON f.profile_id = p.id AND f.tenant_id = p.tenant_id
     WHERE p.tenant_id = $1
       AND ($2::text IS NULL OR p.phone ILIKE '%' || $2 || '%' OR (p.traits->>'name') ILIKE '%' || $2 || '%')
       AND ($4::text IS NULL OR p.traits->>'businessUnitId' = $4)
     ORDER BY ${orderBy}
     LIMIT $3`,
    [tenantId, search, limit, opts.businessUnitId ?? null]
  );
  return rows.map((r) => ({
    ...mapProfile(r),
    ltv: r.monetary_ltv !== null ? Number(r.monetary_ltv) : null,
    purchases90d: r.frequency_90d,
    recencyDays: r.recency_days,
    favoriteItem: r.favorite_item,
  }));
}

// ---------- segments ----------

export async function upsertSegment(
  tenantId: string,
  name: string,
  rule: SegmentRule,
  campaignType: CampaignType,
  opts: { description?: string | null; source?: SegmentSource } = {}
): Promise<Segment> {
  const row = await queryOne(
    `INSERT INTO segments (tenant_id, name, rule, campaign_type, description, source)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (tenant_id, name)
       DO UPDATE SET rule = EXCLUDED.rule, campaign_type = EXCLUDED.campaign_type,
                     description = COALESCE(EXCLUDED.description, segments.description)
     RETURNING *`,
    [
      tenantId,
      name,
      JSON.stringify(rule),
      campaignType,
      opts.description ?? null,
      opts.source ?? "standard",
    ]
  );
  return mapSegment(row);
}

/** Delete a segment — refused if any campaign ever ran against it (history stays). */
export async function deleteSegment(tenantId: string, segmentId: string): Promise<boolean> {
  const used = await queryOne(
    `SELECT 1 FROM campaigns WHERE tenant_id = $1 AND segment_id = $2 LIMIT 1`,
    [tenantId, segmentId]
  );
  if (used) return false;
  await query(`DELETE FROM segments WHERE tenant_id = $1 AND id = $2`, [tenantId, segmentId]);
  return true;
}

export async function listSegments(tenantId: string): Promise<Segment[]> {
  return (await query(`SELECT * FROM segments WHERE tenant_id = $1 ORDER BY name`, [tenantId])).map(
    mapSegment
  );
}

export async function getSegment(tenantId: string, segmentId: string): Promise<Segment | null> {
  const row = await queryOne(`SELECT * FROM segments WHERE tenant_id = $1 AND id = $2`, [
    tenantId,
    segmentId,
  ]);
  return row ? mapSegment(row) : null;
}

// ---------- campaigns ----------

export async function createCampaign(
  tenantId: string,
  segmentId: string,
  audienceSize: number,
  status: CampaignStatus = "pending_approval"
): Promise<Campaign> {
  const row = await queryOne(
    `INSERT INTO campaigns (tenant_id, segment_id, status, audience_size)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [tenantId, segmentId, status, audienceSize]
  );
  return mapCampaign(row);
}

export async function getCampaign(tenantId: string, campaignId: string): Promise<Campaign | null> {
  const row = await queryOne(`SELECT * FROM campaigns WHERE tenant_id = $1 AND id = $2`, [
    tenantId,
    campaignId,
  ]);
  return row ? mapCampaign(row) : null;
}

export async function listCampaigns(
  tenantId: string,
  statuses?: CampaignStatus[]
): Promise<Campaign[]> {
  const rows = statuses?.length
    ? await query(
        `SELECT * FROM campaigns WHERE tenant_id = $1 AND status = ANY($2) ORDER BY created_at DESC`,
        [tenantId, statuses]
      )
    : await query(`SELECT * FROM campaigns WHERE tenant_id = $1 ORDER BY created_at DESC`, [
        tenantId,
      ]);
  return rows.map(mapCampaign);
}

/** Is there already a live (non-rejected) campaign for this segment? Used by the trigger engine to avoid re-enrolling daily. */
export async function hasOpenCampaignForSegment(
  tenantId: string,
  segmentId: string,
  withinDays: number
): Promise<boolean> {
  const row = await queryOne(
    `SELECT 1 FROM campaigns
     WHERE tenant_id = $1 AND segment_id = $2
       AND status IN ('draft','pending_approval','approved','sent')
       AND created_at > now() - ($3 || ' days')::interval
     LIMIT 1`,
    [tenantId, segmentId, String(withinDays)]
  );
  return row !== null;
}

export async function setCampaignCopy(
  tenantId: string,
  campaignId: string,
  copy: GeneratedCopy
): Promise<void> {
  await query(`UPDATE campaigns SET generated_copy = $3 WHERE tenant_id = $1 AND id = $2`, [
    tenantId,
    campaignId,
    JSON.stringify(copy),
  ]);
}

export async function setCampaignCallListCsv(
  tenantId: string,
  campaignId: string,
  csv: string
): Promise<void> {
  await query(`UPDATE campaigns SET call_list_csv = $3 WHERE tenant_id = $1 AND id = $2`, [
    tenantId,
    campaignId,
    csv,
  ]);
}

export async function setCampaignStatus(
  tenantId: string,
  campaignId: string,
  status: CampaignStatus,
  approvedBy?: string
): Promise<Campaign | null> {
  const row = await queryOne(
    `UPDATE campaigns
     SET status = $3,
         approved_at = CASE WHEN $3 = 'approved' THEN now() ELSE approved_at END,
         approved_by = CASE WHEN $3 = 'approved' THEN $4 ELSE approved_by END
     WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    [tenantId, campaignId, status, approvedBy ?? null]
  );
  return row ? mapCampaign(row) : null;
}

// ---------- messages ----------

export async function insertMessages(
  rows: Array<{
    campaignId: string;
    profileId: string;
    channel: Channel;
    renderedText: string;
    isControl: boolean;
    redemptionCode: string | null;
  }>
): Promise<void> {
  if (rows.length === 0) return;
  await withTransaction(async (client) => {
    for (const m of rows) {
      await client.query(
        `INSERT INTO messages (campaign_id, profile_id, channel, rendered_text, is_control, redemption_code)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [m.campaignId, m.profileId, m.channel, m.renderedText, m.isControl, m.redemptionCode]
      );
    }
  });
}

export async function messagesForCampaign(campaignId: string): Promise<Message[]> {
  return (
    await query(`SELECT * FROM messages WHERE campaign_id = $1 ORDER BY is_control, profile_id`, [
      campaignId,
    ])
  ).map(mapMessage);
}

export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus,
  sentAt?: Date
): Promise<void> {
  await query(
    `UPDATE messages SET status = $2, sent_at = coalesce($3, sent_at) WHERE id = $1`,
    [messageId, status, sentAt ?? null]
  );
}

export async function getMessageByRedemptionCode(code: string): Promise<Message | null> {
  const row = await queryOne(`SELECT * FROM messages WHERE redemption_code = $1`, [code]);
  return row ? mapMessage(row) : null;
}

/** Frequency cap: sendable messages created for a profile in the trailing window (controls excluded — they receive nothing). */
export async function countRecentMessages(
  tenantId: string,
  profileIds: string[],
  sinceDays: number
): Promise<Map<string, number>> {
  if (profileIds.length === 0) return new Map();
  const rows = await query<{ profile_id: string; n: string }>(
    `SELECT m.profile_id, count(*)::text AS n
     FROM messages m
     JOIN campaigns c ON c.id = m.campaign_id
     WHERE c.tenant_id = $1 AND m.profile_id = ANY($2::uuid[])
       AND m.is_control = false
       AND coalesce(m.sent_at, now()) > now() - ($3 || ' days')::interval
       AND m.status <> 'failed'
     GROUP BY m.profile_id`,
    [tenantId, profileIds, String(sinceDays)]
  );
  return new Map(rows.map((r) => [r.profile_id, Number(r.n)]));
}

/** WhatsApp messages sent >48h ago, still undelivered/unread, for email fallback. */
export async function messagesNeedingFallback(tenantId: string): Promise<
  Array<Message & { campaignType: CampaignType; tenantId: string }>
> {
  const rows = await query(
    `SELECT m.*, s.campaign_type, c.tenant_id
     FROM messages m
     JOIN campaigns c ON c.id = m.campaign_id
     JOIN segments s ON s.id = c.segment_id
     WHERE c.tenant_id = $1
       AND m.channel = 'whatsapp'
       AND m.is_control = false
       AND m.status = 'sent'
       AND m.sent_at < now() - interval '48 hours'`,
    [tenantId]
  );
  return rows.map((r) => ({ ...mapMessage(r), campaignType: r.campaign_type, tenantId: r.tenant_id }));
}

export async function campaignMessageStats(
  campaignId: string
): Promise<{ total: number; control: number; sent: number; delivered: number; read: number; replied: number; failed: number }> {
  const row = await queryOne<any>(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE is_control)::int AS control,
            count(*) FILTER (WHERE NOT is_control AND status IN ('sent','delivered','read','replied'))::int AS sent,
            count(*) FILTER (WHERE status IN ('delivered','read','replied'))::int AS delivered,
            count(*) FILTER (WHERE status IN ('read','replied'))::int AS read,
            count(*) FILTER (WHERE status = 'replied')::int AS replied,
            count(*) FILTER (WHERE status = 'failed')::int AS failed
     FROM messages WHERE campaign_id = $1`,
    [campaignId]
  );
  return row ?? { total: 0, control: 0, sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 };
}

/**
 * Redemptions attributed to a campaign: redemption events whose recorded
 * code (items[0].name, set by the redemption endpoint/webhook) belongs to
 * one of this campaign's messages.
 */
export async function countRedemptionsForCampaign(campaignId: string): Promise<number> {
  const row = await queryOne<{ n: string }>(
    `SELECT count(*)::text AS n
     FROM events e
     JOIN messages m ON m.redemption_code = e.items->0->>'name'
     WHERE m.campaign_id = $1 AND e.event_type = 'redemption'
       AND e.profile_id = m.profile_id`,
    [campaignId]
  );
  return Number(row?.n ?? 0);
}

/** Monthly repeat-purchase rate for the trailing N months (insights chart). */
export async function monthlyRepeatRate(
  tenantId: string,
  months: number
): Promise<Array<{ month: string; buyers: number; repeaters: number; repeatRate: number }>> {
  const rows = await query<any>(
    `SELECT to_char(date_trunc('month', ts), 'YYYY-MM') AS month,
            count(DISTINCT profile_id)::int AS buyers,
            count(DISTINCT profile_id) FILTER (
              WHERE profile_id IN (
                SELECT profile_id FROM events e2
                WHERE e2.tenant_id = $1 AND e2.event_type = 'purchase'
                  AND date_trunc('month', e2.ts) = date_trunc('month', events.ts)
                GROUP BY profile_id HAVING count(*) >= 2
              )
            )::int AS repeaters
     FROM events
     WHERE tenant_id = $1 AND event_type = 'purchase'
       AND ts > now() - ($2 || ' months')::interval
     GROUP BY 1 ORDER BY 1`,
    [tenantId, String(months)]
  );
  return rows.map((r) => ({
    month: r.month,
    buyers: r.buyers,
    repeaters: r.repeaters,
    repeatRate: r.buyers > 0 ? Math.round((r.repeaters / r.buyers) * 1000) / 1000 : 0,
  }));
}

// ---------- preferences ----------

export async function upsertPreference(p: Preference): Promise<void> {
  await query(
    `INSERT INTO preferences (tenant_id, campaign_type, enabled, max_per_customer_per_week)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (tenant_id, campaign_type)
       DO UPDATE SET enabled = EXCLUDED.enabled,
                     max_per_customer_per_week = EXCLUDED.max_per_customer_per_week`,
    [p.tenantId, p.campaignType, p.enabled, p.maxPerCustomerPerWeek]
  );
}

export async function getPreferences(tenantId: string): Promise<Preference[]> {
  const rows = await query(
    `SELECT * FROM preferences WHERE tenant_id = $1 ORDER BY campaign_type`,
    [tenantId]
  );
  return rows.map((r: any) => ({
    tenantId: r.tenant_id,
    campaignType: r.campaign_type,
    enabled: r.enabled,
    maxPerCustomerPerWeek: r.max_per_customer_per_week,
  }));
}

export async function getPreference(
  tenantId: string,
  campaignType: CampaignType
): Promise<Preference | null> {
  const prefs = await getPreferences(tenantId);
  return prefs.find((p) => p.campaignType === campaignType) ?? null;
}

// ---------- uploads ----------

export async function createUpload(tenantId: string, filename: string): Promise<Upload> {
  const row = await queryOne(
    `INSERT INTO uploads (tenant_id, filename) VALUES ($1, $2) RETURNING *`,
    [tenantId, filename]
  );
  return mapUpload(row);
}

export async function finishUpload(
  tenantId: string,
  uploadId: string,
  status: UploadStatus,
  rowsProcessed: number,
  errorLog: string | null
): Promise<void> {
  await query(
    `UPDATE uploads SET status = $3, rows_processed = $4, error_log = $5
     WHERE tenant_id = $1 AND id = $2`,
    [tenantId, uploadId, status, rowsProcessed, errorLog]
  );
}

export async function listUploads(tenantId: string): Promise<Upload[]> {
  return (
    await query(`SELECT * FROM uploads WHERE tenant_id = $1 ORDER BY uploaded_at DESC LIMIT 50`, [
      tenantId,
    ])
  ).map(mapUpload);
}

// ---------- opt-outs & WhatsApp opt-ins ----------

export async function addOptOut(tenantId: string, phone: string): Promise<void> {
  await query(
    `INSERT INTO opt_outs (tenant_id, phone) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [tenantId, phone]
  );
}

export async function getOptedOutPhones(tenantId: string): Promise<Set<string>> {
  const rows = await query<{ phone: string }>(
    `SELECT phone FROM opt_outs WHERE tenant_id = $1`,
    [tenantId]
  );
  return new Set(rows.map((r) => r.phone));
}

export async function addWhatsappOptIn(
  tenantId: string,
  phone: string,
  source: string
): Promise<void> {
  await query(
    `INSERT INTO whatsapp_opt_ins (tenant_id, phone, source) VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [tenantId, phone, source]
  );
}

export async function getWhatsappOptIns(tenantId: string): Promise<Set<string>> {
  const rows = await query<{ phone: string }>(
    `SELECT phone FROM whatsapp_opt_ins WHERE tenant_id = $1`,
    [tenantId]
  );
  return new Set(rows.map((r) => r.phone));
}

// ---------- WhatsApp templates ----------

export interface WhatsappTemplate {
  id: string;
  tenantId: string;
  name: string;
  body: string;
  variables: string[];
  status: "draft" | "submitted" | "approved" | "rejected";
  campaignType: CampaignType | null;
}

export async function upsertWhatsappTemplate(t: Omit<WhatsappTemplate, "id">): Promise<void> {
  await query(
    `INSERT INTO whatsapp_templates (tenant_id, name, body, variables, status, campaign_type)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (tenant_id, name)
       DO UPDATE SET body = EXCLUDED.body, variables = EXCLUDED.variables,
                     status = EXCLUDED.status, campaign_type = EXCLUDED.campaign_type`,
    [t.tenantId, t.name, t.body, JSON.stringify(t.variables), t.status, t.campaignType]
  );
}

export async function getApprovedTemplate(
  tenantId: string,
  campaignType: CampaignType
): Promise<WhatsappTemplate | null> {
  const row = await queryOne(
    `SELECT * FROM whatsapp_templates
     WHERE tenant_id = $1 AND campaign_type = $2 AND status = 'approved' LIMIT 1`,
    [tenantId, campaignType]
  );
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    body: row.body,
    variables: row.variables,
    status: row.status,
    campaignType: row.campaign_type,
  };
}

export type { AttributionReport };
