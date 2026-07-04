// ============================================================
// Shared types for HPAS. Everything is tenant-scoped: any type
// that maps to a DB row carries tenantId, and every query layer
// function requires it. Dadu's is seed data, never a type.
// ============================================================

// ---------- Tenant & config ----------

export type ModuleKey =
  | "insights"
  | "campaigns"
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

export interface TenantConfig {
  slug: string;
  branding: TenantBranding;
  modules: Record<ModuleKey, { enabled: boolean; order: number }>;
  brandVoice: BrandVoice;
  festivals: FestivalConfigEntry[];
  posColumnMapping: PosColumnMapping;
  channels: ChannelSettings;
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

export interface Segment {
  id: string;
  tenantId: string;
  name: string;
  rule: SegmentRule;
  campaignType: CampaignType;
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
