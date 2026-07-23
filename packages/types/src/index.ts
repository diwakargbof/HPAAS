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
  | "settings"
  | "billing"
  | "customers"
  | "pricing";

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

/** One coupon rule: bills at or above minAmount earn this reward. */
export interface CouponTier {
  /** Inclusive lower bound on the bill amount (₹) for this tier. */
  minAmount: number;
  discountType: "percent" | "flat";
  /** Percent off (e.g. 10) or flat rupees off, per discountType. */
  discountValue: number;
  /** Days until the issued coupon expires. */
  validityDays: number;
}

/**
 * Admin-configurable coupon issuance rules. Evaluated deterministically at
 * receipt time: the highest matching tier wins; the frequency guard stops
 * a regular from collecting a coupon on every single visit.
 */
export interface CouponConfig {
  enabled: boolean;
  /** Highest matching minAmount wins. Empty = no coupons ever issued. */
  tiers: CouponTier[];
  /** Minimum days between two coupons for the same customer. */
  minDaysBetweenCoupons: number;
  /** Prefix of generated codes, e.g. "DADU" → DADU-CP-X7K2M9. Defaults from slug. */
  codePrefix?: string;
}

/** WhatsApp bill sent right after an offline purchase (streaming POS only). */
export interface ReceiptConfig {
  enabled: boolean;
  /** Include itemized lines, not just the total. */
  showItems: boolean;
  /** Optional closing line, e.g. "See you soon!" */
  footerNote?: string;
}

/** Per-order QR capture of online (Swiggy/Zomato/...) customers. */
export interface QrCaptureConfig {
  enabled: boolean;
  /** Pre-drafted wa.me message; {{token}} and {{shop_name}} are filled in. */
  messageTemplate?: string;
}

/**
 * The tenant's own GST/business details, filled in by the shop owner —
 * everything a GST tax invoice legally needs beyond the line items
 * themselves. All optional: a tenant with no billing profile yet can't
 * generate invoices (see billingProfileConfig()'s isComplete flag), but
 * every other feature is unaffected.
 */
export interface BillingProfileConfig {
  legalName?: string;
  gstin?: string;
  pan?: string;
  addressLines?: string[];
  state?: string;
  /** Prefix for generated invoice numbers, e.g. "DADU" → DADU-0001. */
  invoicePrefix?: string;
  /** Applied to menu items with no gstRate of their own. */
  defaultGstRate?: number;
  /** Applied to menu items with no hsnCode of their own. */
  defaultHsnCode?: string;
}

/**
 * Per-item price-optimization settings. Whether the tenant sees this at all
 * is gated by `modules.pricing.enabled` (an admin-set flag — see
 * KNOWLEDGE_GRAPH.md's `ai-pricing` node); this config is what the tenant
 * fills in once they have access: which items to optimize and within what
 * bounds. All optional per item — an item with no entry is skipped unless
 * `applyToAllItems` is set.
 */
export interface PricingItemConfig {
  enabled: boolean;
  minPrice?: number;
  maxPrice?: number;
  /** Overrides defaultMaxChangePercent for this item only. */
  maxChangePercent?: number;
}

export interface PricingConfig {
  /** Optimize every menu item, ignoring individual `items[id].enabled` flags. */
  applyToAllItems: boolean;
  /** Cap on suggested price change (%) for items with no per-item override. */
  defaultMaxChangePercent: number;
  /** Name of a festival in `festivals[]` to bias recommendations toward, if any. */
  occasion?: string;
  items: Record<string, PricingItemConfig>;
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
  /** Optional — defaults applied in code when absent (see receiptConfig()). */
  receipts?: ReceiptConfig;
  /** Optional — defaults applied in code when absent (see couponConfig()). */
  coupons?: CouponConfig;
  /** Optional — defaults applied in code when absent (see qrCaptureConfig()). */
  qrCapture?: QrCaptureConfig;
  /** Optional — defaults applied in code when absent (see billingProfileConfig()). */
  billingProfile?: BillingProfileConfig;
  /** Optional — defaults applied in code when absent (see pricingConfig()). */
  pricingConfig?: PricingConfig;
}

/** Loyalty settings with defaults for tenants configured before the feature existed. */
export function loyaltyConfig(config: TenantConfig): LoyaltyConfig {
  return config.loyalty ?? { enabled: true, pointsPerRupee: 0.1, pointValueRupees: 0.25 };
}

/** Receipt settings with defaults for tenants configured before the feature existed. */
export function receiptConfig(config: TenantConfig): ReceiptConfig {
  return config.receipts ?? { enabled: true, showItems: true };
}

/** Coupon settings with defaults: off until the admin configures tiers. */
export function couponConfig(config: TenantConfig): CouponConfig {
  return config.coupons ?? { enabled: false, tiers: [], minDaysBetweenCoupons: 7 };
}

/** QR capture settings with defaults for tenants configured before the feature existed. */
export function qrCaptureConfig(config: TenantConfig): QrCaptureConfig {
  return config.qrCapture ?? { enabled: true };
}

/** Billing profile with defaults for tenants who haven't filled one in yet. */
export function billingProfileConfig(config: TenantConfig): BillingProfileConfig {
  return config.billingProfile ?? {};
}

/** A tenant can't issue a legally-adequate GST invoice without these two. */
export function billingProfileIsComplete(profile: BillingProfileConfig): boolean {
  return Boolean(profile.legalName?.trim() && profile.gstin?.trim());
}

/** Pricing settings with defaults for tenants who haven't configured any items yet. */
export function pricingConfig(config: TenantConfig): PricingConfig {
  return config.pricingConfig ?? { applyToAllItems: false, defaultMaxChangePercent: 15, items: {} };
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
  /** GST slab (%), e.g. 5, 12, 18. Falls back to billingProfile.defaultGstRate on invoices when unset. */
  gstRate: number | null;
  /** Falls back to billingProfile.defaultHsnCode on invoices when unset. */
  hsnCode: string | null;
  createdAt: Date;
}

// ---------- GST billing ----------

export interface InvoiceLineItem {
  name: string;
  hsnCode: string;
  qty: number;
  unitPrice: number;
  gstRate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  token: string;
  invoiceNumber: string;
  profileId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  lineItems: InvoiceLineItem[];
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  /** Present only when a discount was applied — authorizing employee is then mandatory. */
  discountType: "percent" | "flat" | null;
  discountValue: number;
  discountAmount: number;
  authorizedByName: string | null;
  authorizedById: string | null;
  status: "issued" | "cancelled";
  createdAt: Date;
}

/** Discount to apply to an invoice — the authorizing employee is mandatory whenever a discount is given. */
export interface InvoiceDiscount {
  type: "percent" | "flat";
  value: number;
  authorizedByName: string;
  authorizedById: string;
}

// ---------- AI Pricing ----------

/** A per-item price-optimization suggestion, stored once per (tenant, item). */
export interface PriceRecommendation {
  menuItemId: string;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  changePercent: number;
  demandTrend: "rising" | "falling" | "flat";
  confidence: "low" | "medium" | "high";
  rationale: string | null;
  computedAt: Date;
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

// ---------- Coupons ----------

export type CouponSource = "receipt" | "qr_welcome" | "manual";

/** A personalized coupon issued to one customer; code is globally unique. */
export interface Coupon {
  id: string;
  tenantId: string;
  profileId: string;
  phone: string;
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  issuedForAmount: number;
  source: CouponSource;
  expiresAt: Date;
  redeemedAt: Date | null;
  createdAt: Date;
}

// ---------- QR order capture (online/aggregator customers) ----------

export type QrOrderStatus = "pending" | "claimed";

/**
 * One QR per online order. Scanning opens WhatsApp with the token
 * pre-drafted; the customer sending it claims the order and enters
 * the system with their phone number attached to real order data.
 */
export interface QrOrder {
  id: string;
  tenantId: string;
  /** Unguessable short token, e.g. "Q-7KX2M9P4QA" — also the claim URL path. */
  token: string;
  /** The aggregator's order id, for the shop's own reconciliation. */
  orderRef: string;
  /** Where the order came from: swiggy | zomato | ondc | other. */
  source: string;
  amount: number;
  items: EventItem[];
  status: QrOrderStatus;
  claimedProfileId: string | null;
  claimedAt: Date | null;
  createdAt: Date;
}

// ---------- Transactional (system) messages ----------
// Receipts and QR welcomes. Separate from campaign messages AND direct
// messages so attribution, hold-outs, and the owner's 1:1 history stay clean.

export type TransactionalKind = "receipt" | "qr_welcome" | "invoice";

export interface TransactionalMessage {
  id: string;
  tenantId: string;
  profileId: string;
  kind: TransactionalKind;
  channel: Channel;
  body: string;
  status: "sent" | "failed";
  sentAt: Date;
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
