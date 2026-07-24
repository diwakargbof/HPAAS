// The ONLY place in the entire codebase that talks to an LLM API.
// One call per campaign — never per message, never at send time.

import Anthropic from "@anthropic-ai/sdk";
import type {
  AuthorSegmentRequest,
  CopyProvider,
  CopyRequest,
  CopyResult,
  DiscoverSegmentsRequest,
  InventoryRationaleRequest,
  InventoryRationaleResult,
  PitchRequest,
  PricingRationaleRequest,
  PricingRationaleResult,
  SegmentProposal,
} from "./provider.js";

/**
 * The rule vocabulary handed to the model verbatim. The model authors
 * *data*; @hpas/core's whitelisted compiler is still the only thing that
 * turns rules into SQL, so a hallucinated column fails loudly at preview,
 * never at query time.
 */
const RULE_SCHEMA_DOC = `Rules are JSON filters over these columns of a per-customer features table:
- recency_days (int): days since last purchase
- frequency_90d (int): purchases in the last 90 days
- monetary_ltv (number): lifetime spend in rupees
- category_affinity (string): the category they spend most on
- festival_buyer (boolean): bought during a festival window before
- reorder_cadence_days (int, may be null): median days between their purchases
- favorite_item (string): their most-purchased item
Operators: ">", ">=", "<", "<=", "=", "!=", "in" (array), "gte_col"/"lte_col" (compare to another column).
A bare value means equality. Example:
{"recency_days": {">": 60, "<=": 90}, "category_affinity": {"in": ["sweets", "gift-boxes"]}}
Campaign types: winback | festival_preorder | new_item_alert | reorder_reminder.`;

const DEFAULT_MODEL = "claude-opus-4-8";

const CAMPAIGN_INTENT: Record<string, string> = {
  winback:
    "A gentle win-back message for customers who haven't visited in a while. Warm, no guilt-tripping.",
  festival_preorder:
    "A pre-festival message inviting customers to pre-order their festival favorites before the rush.",
  new_item_alert:
    "A short heads-up about fresh/new items in categories this customer already loves.",
  reorder_reminder:
    "A friendly reminder that it's about the time they usually restock their favorites.",
};

export class AnthropicCopyProvider implements CopyProvider {
  readonly name = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    this.client = new Anthropic(opts?.apiKey ? { apiKey: opts.apiKey } : {});
    this.model = opts?.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  }

  async generateTemplate(req: CopyRequest): Promise<CopyResult> {
    const system = [
      `You write WhatsApp marketing messages for "${req.shopName}", a small Indian retail shop.`,
      `Brand voice: ${req.brandVoice.tone}. Language: ${req.brandVoice.language}.`,
      req.brandVoice.samplePhrases.length
        ? `Phrases the shop actually uses: ${req.brandVoice.samplePhrases.join(" | ")}`
        : "",
      req.brandVoice.avoid.length ? `Never use: ${req.brandVoice.avoid.join(", ")}.` : "",
      "",
      "Rules:",
      "- Write ONE message template, max 300 characters, suitable for WhatsApp.",
      `- Use {{variable}} placeholders from this exact list only: ${req.availableVariables.join(", ")}.`,
      "- Personalize with placeholders instead of concrete customer values.",
      "- No links, no ALL-CAPS, at most one emoji.",
      "- Reply with the template text ONLY — no quotes, no explanation.",
    ]
      .filter(Boolean)
      .join("\n");

    const userMessage = [
      `Campaign type: ${req.campaignType} — ${CAMPAIGN_INTENT[req.campaignType] ?? ""}`,
      `Audience segment: "${req.segmentName}" (rule: ${JSON.stringify(req.segmentRule)})`,
      req.festival
        ? `Festival: ${req.festival.name} on ${req.festival.date} (categories: ${req.festival.categories.join(", ")})`
        : "",
      req.newItems?.length
        ? `Actually new on the menu (you may name ONE of these in the message): ${req.newItems
            .map((i) => `${i.name} (${i.category}, ₹${i.price})`)
            .join("; ")}`
        : "",
      "",
      "Representative customers in this audience:",
      ...req.sampleCustomers.map(
        (c) =>
          `- ${c.firstName ?? "(no name)"}: favorite "${c.favoriteItem ?? "?"}", buys ${c.categoryAffinity ?? "?"}, last visit ${c.daysSinceLastVisit} days ago`
      ),
    ]
      .filter(Boolean)
      .join("\n");

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!text) throw new Error("copy provider returned empty template");

    return { template: text, provider: this.name, model: response.model };
  }

  async authorSegment(req: AuthorSegmentRequest): Promise<SegmentProposal> {
    const text = await this.ask(
      [
        `You translate a shop owner's plain-language audience description into a segment definition for "${req.context.shopName}".`,
        RULE_SCHEMA_DOC,
        segmentContextBlock(req.context),
        `Reply with JSON ONLY, shaped exactly:`,
        `{"name": "...", "description": "...", "campaignType": "...", "rule": {...}}`,
        `- name: short (<= 40 chars), in the owner's language`,
        `- description: one plain-English sentence stating who matches`,
        `- pick the campaignType that best fits the intent`,
      ].join("\n"),
      `Owner's description: "${req.prompt}"`
    );
    return parseJson<SegmentProposal>(text);
  }

  async discoverSegments(req: DiscoverSegmentsRequest): Promise<SegmentProposal[]> {
    const text = await this.ask(
      [
        `You are a retention analyst for "${req.context.shopName}", a small Indian shop. From the aggregate stats below, propose the most commercially interesting customer segments the owner doesn't already have.`,
        RULE_SCHEMA_DOC,
        segmentContextBlock(req.context),
        `Aggregate stats: ${JSON.stringify(req.stats)}`,
        `Existing segments (do NOT duplicate): ${req.existingSegmentNames.join(", ") || "none"}`,
        `Reply with JSON ONLY: an array of 2-4 objects shaped {"name", "description", "campaignType", "rule"}.`,
        `Favor segments that are actionable (big enough to matter, specific enough to message well).`,
      ].join("\n"),
      "Propose the segments."
    );
    const proposals = parseJson<SegmentProposal[]>(text);
    if (!Array.isArray(proposals)) throw new Error("expected an array of segment proposals");
    return proposals.slice(0, 4);
  }

  async writeCounterPitch(req: PitchRequest): Promise<string> {
    const c = req.customer;
    const text = await this.ask(
      [
        `You write ONE short line (max 140 chars) a cashier at "${req.shopName}" says out loud to a customer at the counter.`,
        `Brand voice: ${req.brandVoice.tone}.`,
        `Warm and specific, never pushy, no emoji, no quotes around the line. Reply with the line ONLY.`,
      ].join("\n"),
      [
        `Customer: ${c.firstName ?? "(name unknown)"}, favorite: ${c.favoriteItem ?? "unknown"}, last visit ${c.daysSinceLastVisit ?? "?"} days ago, loyalty balance ${c.loyaltyBalance} points.`,
        `Suggest: ${req.recommendations.map((r) => `${r.item} (${r.reason})`).join("; ") || "nothing specific"}.`,
        req.activeFestival ? `Festival coming up: ${req.activeFestival}.` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
    return text.trim();
  }

  async writePricingRationale(req: PricingRationaleRequest): Promise<PricingRationaleResult[]> {
    const text = await this.ask(
      [
        `You explain price-change recommendations for "${req.shopName}", a small Indian retail shop, to its owner.`,
        `For each item below, write ONE short reason (max 140 chars, plain language, no jargon) the owner can read before deciding whether to apply it.`,
        req.occasion ? `These recommendations are timed for the upcoming ${req.occasion}.` : "",
        `Reply with JSON ONLY: an array of {"menuItemId", "rationale"}, one per item, same order as given.`,
      ]
        .filter(Boolean)
        .join("\n"),
      req.items
        .map(
          (it) =>
            `- ${it.menuItemId}: "${it.name}", ₹${it.currentPrice} → ₹${it.suggestedPrice} (demand ${it.demandTrend})`
        )
        .join("\n")
    );
    const parsed = parseJson<PricingRationaleResult[]>(text);
    if (!Array.isArray(parsed)) throw new Error("expected an array of pricing rationales");
    return parsed;
  }

  async writeInventoryRationale(req: InventoryRationaleRequest): Promise<InventoryRationaleResult[]> {
    const text = await this.ask(
      [
        `You explain stock-reorder suggestions for "${req.shopName}", a small Indian retail shop, to its owner.`,
        `For each item below, write ONE short reason (max 140 chars, plain language, no jargon) the owner can read before deciding whether to place the order.`,
        `Reply with JSON ONLY: an array of {"menuItemId", "rationale"}, one per item, same order as given.`,
      ].join("\n"),
      req.items
        .map(
          (it) =>
            `- ${it.menuItemId}: "${it.name}", days of stock left: ${it.daysOfStockLeft ?? "unknown"}, suggested order qty: ${it.suggestedOrderQty}, urgency: ${it.urgency}`
        )
        .join("\n")
    );
    const parsed = parseJson<InventoryRationaleResult[]>(text);
    if (!Array.isArray(parsed)) throw new Error("expected an array of inventory rationales");
    return parsed;
  }

  /** One system+user round trip, text back. */
  private async ask(system: string, user: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    });
    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  }
}

function segmentContextBlock(ctx: AuthorSegmentRequest["context"]): string {
  return [
    `Shop context:`,
    `- categories sold: ${ctx.categories.join(", ") || "unknown"}`,
    `- customer count: ${ctx.totalProfiles}`,
    `- lifetime-spend quartiles (₹): p25=${ctx.ltvQuartiles[0] ?? "?"}, p50=${ctx.ltvQuartiles[1] ?? "?"}, p75=${ctx.ltvQuartiles[2] ?? "?"}, p90=${ctx.ltvQuartiles[3] ?? "?"}`,
    `Use these real numbers when the owner says vague things like "big spenders".`,
  ].join("\n");
}

/** Parse model JSON output, tolerating a fenced code block. */
function parseJson<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.search(/[[{]/);
  if (start === -1) throw new Error("model reply contained no JSON");
  return JSON.parse(cleaned.slice(start)) as T;
}
