// The ONLY place in the entire codebase that talks to an LLM API.
// One call per campaign — never per message, never at send time.

import Anthropic from "@anthropic-ai/sdk";
import type { CopyProvider, CopyRequest, CopyResult } from "./provider.js";

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
}
