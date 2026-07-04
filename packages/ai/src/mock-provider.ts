// Deterministic fallback used when no ANTHROPIC_API_KEY is configured —
// keeps the whole demo runnable offline. Same interface, no network.

import type { CopyProvider, CopyRequest, CopyResult } from "./provider.js";

const TEMPLATES: Record<string, string> = {
  winback:
    "Namaste {{name}} ji! It's been {{days_since_visit}} days since we saw you at {{shop_name}}. Your favorite {{favorite_item}} is fresh from our kitchen — show code {{redemption_code}} and treat yourself soon! 🪔",
  festival_preorder:
    "Namaste {{name}} ji! {{festival_name}} is coming — pre-order your {{favorite_item}} and festive {{category}} at {{shop_name}} today, skip the rush. Mention code {{redemption_code}} when you order!",
  new_item_alert:
    "Namaste {{name}} ji! Fresh new {{category}} just landed at {{shop_name}} — we think you'll love them as much as your usual {{favorite_item}}. Show code {{redemption_code}} on your next visit!",
  reorder_reminder:
    "Namaste {{name}} ji! About time to restock your {{favorite_item}}, isn't it? Fresh batch waiting at {{shop_name}} — show code {{redemption_code}} when you drop by!",
};

export class MockCopyProvider implements CopyProvider {
  readonly name = "mock";

  async generateTemplate(req: CopyRequest): Promise<CopyResult> {
    const template =
      TEMPLATES[req.campaignType] ??
      "Namaste {{name}} ji! We'd love to see you at {{shop_name}} soon.";
    return { template, provider: this.name, model: "mock-template-v1" };
  }
}
