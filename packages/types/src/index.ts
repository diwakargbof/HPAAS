// ============================================================
// Shared types for HPAS. Everything is tenant-scoped: any type
// that maps to a DB row carries tenantId, and every query layer
// function requires it. Dadu's is seed data, never a type.
// ============================================================

// ---------- Tenant & config ----------

export type ModuleKey =
  | "insights"
  | "segments"
  | "campaigns"
  | "loyalty"
  | "menu"
  | "preferences"
  | "data"
  | "settings";

export type CampaignType =
  | "winback"
  | "festival_preorder"
  | "new_item_alert"
  | "reorder_reminder";

export const ALL_CAMPAIGN_TYPES: CampaignType[] = [
  "winback",
  "festival_preorder",
  "new_item_alert",
  "reorder_reminder",
];

export interface TenantBranding {
  shopName: string;
  logoUrl: string;
  colors: { primary: string; accent: string; background: string };
}

export interface BrandVoice {
  tone: string;
  language: string;
  samplePhrases: string[];
  avoid: string[];
}

export interface FestivalConfigEntry {
  name: string;
  /** ISO date (YYYY-MM-DD) of the festival this year */
  date: string;
  /** Days before `date` during which festival campaigns may trigger */
  preWindowDays: number;
  /** Item categories this festival drives demand for */
  categories: string[];
}

/**
 * How to read this tenant's POS CSV export. Column values are the
 * *header names in the tenant's CSV*, so a new shop's export format
 * is onboarded by editing config, never code.
 */
export interface PosColumnMapping {
  phone: string;
  name?: string;
  email?: string;
  amount: string;
  items: string;
  /** Separates multiple items inside the items cell, e.g. ";" */
  itemsDelimiter: string;
  /**
   * Order of fields within one item entry, "|"-separated parts:
   * e.g. "name|category|qty|unitPrice" for "Kaju Katli|sweets|2|275"
   */
  itemFormat: string;
  itemPartsDelimiter: string;
  timestamp: string;
  /** dayjs-style parse format, e.g. "DD/MM/YYYY HH:mm" */
  dateFormat: string;
  locationId?: string;
}

export interface ChannelSettings {
  whatsapp: { enabled: boolean; number: string };
  email: { enabled: boolean; fromAddress: string };
  callList: { enabled: boolean; minLtvThreshold: number };
}

export interface LoyaltyConfig {
  enabled: boolean;
  /** Points earned per rupee spent, e.g. 0.1 = 1 point per ₹10. */
  pointsPerRupee: number;
  /** Redemption value of one point in rupees (display/guidance only). */
  pointValueRupees: number;
}

export interface TenantConfig {
  slug: string;
  branding: TenantBranding;
  /** Partial: tenants only list the modules they use; missing = hidden. */
  modules: Partial<Record<ModuleKey, { enabled: boolean; order: number }>>;
  brandVoice: BrandVoice;
  festivals: FestivalConfigEntry[];
  posColumnMapping: PosColumnMapping;
  channels: ChannelSettings;
  /** Optional — defaults applied in code when absent (see loyaltyConfig()). */
  loyalty?: LoyaltyConfig;
}

/** Loyalty settings with defaults for tenants configured before the feature existed. */
export function loyaltyConfig(config: TenantConfig): LoyaltyConfig {
  return config.loyalty ?? { enabled: true, pointsPerRupee: 0.1, pointValueRupees: 0.25 };
}

export interface Tenant {
  id: string;
  name: string;
  config: TenantConfig;
  whatsappNumber: string;
  apiKey: string;
  createdAt: Date;
}

// ---------- Profiles & events ----------

export interface ProfileTraits {
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export interface Profile {
  id: string;
  tenantId: string;
  /** E.164, normalized by @hpas/core/phone — the only allowed writer */
  phone: string;
  traits: ProfileTraits;
  createdAt: Date;
}

export interface EventItem {
  name: string;
  category: string;
  qty: number;
  unitPrice: number;
}

export type EventType =
  | "purchase"
  | "redemption"
  | "message_reply"
  | "opt_out"
  | "opt_in";

/** The single normalized event shape both ingestion paths produce. */
export interface NormalizedEvent {
  tenantId: string;
  phone: string;
  traits?: ProfileTraits;
  locationId?: string;
  eventType: EventType;
  items: EventItem[];
  amount: number;
  ts: Date;
}

export interface EventRow {
  id: string;
  tenantId: string;
  profileId: string;
  locationId: string | null;
  eventType: EventType;
  items: EventItem[];
  amount: number;
  ts: Date;
}

// ---------- Features ----------

export interface Features {
  profileId: string;
  tenantId: string;
  recencyDays: number;
  frequency90d: number;
  monetaryLtv: number;
  categoryAffinity: string | null;
  festivalBuyer: boolean;
  lastFestivalBasket: EventItem[] | null;
  reorderCadenceDays: number | null;
  favoriteItem: string | null;
  computedAt: Date;
}

// ---------- Segments ----------

/**
 * A segment rule is a JSON filter over columns of the `features` table.
 * Operators: ">", ">=", "<", "<=", "=", "!=", "in",
 * plus "gte_col" / "lte_col" to compare against another features column
 * (e.g. recency_days >= reorder_cadence_days).
 * A bare value means equality: {"category_affinity": "sweets"}.
 */
export type RuleOperator =
  | ">"
  | ">="
  | "<"
  | "<="
  | "="
  | "!="
  | "in"
  | "gte_col"
  | "lte_col";

export type RuleCondition =
  | string
  | number
  | boolean
  | Partial<Record<RuleOperator, string | number | boolean | Array<string | number>>>;

export type SegmentRule = Record<string, RuleCondition>;

/** Where a segment came from: seeded standard, owner-typed via AI, or AI-discovered. */
export type SegmentSource = "standard" | "custom" | "ai_suggested";

export interface Segment {
  id: string;
  tenantId: string;
  name: string;
  rule: SegmentRule;
  campaignType: CampaignType;
  /** Plain-English meaning of the rule, shown to the shop owner. */
  description: string | null;
  source: SegmentSource;
}

// ---------- Campaigns & messages ----------

export type CampaignStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "rejected";

/** Cached AI output: one template per campaign, variables filled at send time. */
export interface GeneratedCopy {
  /** e.g. "Hi {{name}}, your favorite {{favorite_item}} is waiting..." */
  template: string;
  /** Placeholders the template uses, e.g. ["name", "favorite_item"] */
  variables: string[];
  /** A few pre-rendered examples for the approval queue UI */
  samples: Array<{ profileId: string; rendered: string }>;
  provider: string;
  model: string;
  generatedAt: string;
}

export interface Campaign {
  id: string;
  tenantId: string;
  segmentId: string;
  status: CampaignStatus;
  generatedCopy: GeneratedCopy | null;
  audienceSize: number;
  createdAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  /** Call-list CSV for high-LTV customers routed to a human call, if any were. */
  callListCsv: string | null;
}

export type Channel = "whatsapp" | "email" | "call";

export type MessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "replied"
  | "failed";

export interface Message {
  id: string;
  campaignId: string;
  profileId: string;
  channel: Channel;
  renderedText: string;
  status: MessageStatus;
  isControl: boolean;
  redemptionCode: string | null;
  sentAt: Date | null;
}

// ---------- Preferences, uploads, opt-outs ----------

export interface Preference {
  tenantId: string;
  campaignType: CampaignType;
  enabled: boolean;
  maxPerCustomerPerWeek: number;
}

export type UploadStatus = "processing" | "success" | "error";

export interface Upload {
  id: string;
  tenantId: string;
  filename: string;
  status: UploadStatus;
  rowsProcessed: number;
  errorLog: string | null;
  uploadedAt: Date;
}

// ---------- Channels (send interface) ----------

export interface SendResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface ChannelAdapter {
  channel: Channel;
  send(profile: Profile, renderedText: string, meta: SendMeta): Promise<SendResult>;
}

export interface SendMeta {
  tenantId: string;
  campaignId: string;
  messageId: string;
  campaignType: CampaignType;
  redemptionCode: string | null;
}

// ---------- Attribution ----------

export interface AttributionReport {
  campaignId: string;
  messagedCount: number;
  controlCount: number;
  messagedRepeatRate: number;
  controlRepeatRate: number;
  incrementalRepeatRate: number;
  messagedRevenuePerCustomer: number;
  controlRevenuePerCustomer: number;
  incrementalRevenuePerCustomer: number;
  redemptions: number;
  computedAt: string;
}

// ---------- Menu ----------

export interface MenuItem {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  tags: string[];
  available: boolean;
  createdAt: Date;
}

// ---------- Loyalty ----------

/** Append-only points ledger; balance is the sum of entries. */
export interface LoyaltyEntry {
  id: string;
  tenantId: string;
  profileId: string;
  /** Positive = earned/awarded, negative = redeemed/adjusted down. */
  points: number;
  reason: string;
  createdAt: Date;
}

// ---------- Direct (1:1) messages ----------
// Separate from campaign messages on purpose: personal notes from the shop
// owner must never pollute campaign attribution or hold-out accounting.

export type DirectMessageStatus = "sent" | "failed";

export interface DirectMessage {
  id: string;
  tenantId: string;
  profileId: string;
  channel: Channel;
  body: string;
  status: DirectMessageStatus;
  sentBy: string;
  sentAt: Date;
}

// ---------- Counter recommendations ----------

export interface CounterRecommendation {
  item: string;
  category: string;
  /** From the menu when one exists, else median observed price. */
  price: number | null;
  /** Plain-English reason the cashier can say out loud. */
  reason: string;
  /** Which signal ranked it: pairs_with | due_reorder | category_new | festival. */
  signal: string;
}

export interface CounterCard {
  profileId: string;
  name: string | null;
  phone: string;
  lastVisitDays: number | null;
  favoriteItem: string | null;
  loyalty: { balance: number; valueRupees: number };
  recommendations: CounterRecommendation[];
  /** One-line cashier pitch (AI-written, cached ~24h; deterministic fallback). */
  pitch: string;
  activeFestival: string | null;
  computedAt: string;
}
