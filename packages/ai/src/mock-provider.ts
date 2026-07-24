// Deterministic fallback used when no ANTHROPIC_API_KEY is configured —
// keeps the whole demo (copy, segment authoring, discovery, counter pitch)
// runnable offline. Same interface, no network.

import type { SegmentRule } from "@hpas/types";
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

  /**
   * Keyword heuristics over the owner's prompt — deliberately simple, but
   * produces valid rules so the offline demo exercises the same
   * preview/save path as the real provider.
   */
  async authorSegment(req: AuthorSegmentRequest): Promise<SegmentProposal> {
    const p = req.prompt.toLowerCase();
    const rule: SegmentRule = {};
    let campaignType: SegmentProposal["campaignType"] = "new_item_alert";
    const parts: string[] = [];

    const range = p.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*day/);
    const single = p.match(/(\d+)\s*day/);
    if (range) {
      rule.recency_days = { ">": Number(range[1]), "<=": Number(range[2]) };
      parts.push(`last visit ${range[1]}-${range[2]} days ago`);
      campaignType = "winback";
    } else if (/lapsed|haven'?t (?:visited|been|bought)|miss|inactive|stopped/.test(p)) {
      const days = single ? Number(single[1]) : 60;
      rule.recency_days = { ">": days };
      parts.push(`no visit in ${days}+ days`);
      campaignType = "winback";
    } else if (/regular|frequent|often|loyal|repeat/.test(p)) {
      rule.frequency_90d = { ">=": 3 };
      parts.push("3+ purchases in 90 days");
      campaignType = "reorder_reminder";
    }

    if (/festival|diwali|holi|rakhi|raksha/.test(p)) {
      rule.festival_buyer = true;
      parts.push("bought during festivals before");
      campaignType = "festival_preorder";
    }

    const spend = p.match(/(?:spent|spend|worth|over|above)\D*(\d{3,})/);
    if (spend || /big spender|high value|top customer|vip/.test(p)) {
      const threshold = spend ? Number(spend[1]) : req.context.ltvQuartiles[2] ?? 5000;
      rule.monetary_ltv = { ">=": threshold };
      parts.push(`lifetime spend ₹${threshold}+`);
    }

    const category = req.context.categories.find((c) => p.includes(c.toLowerCase()));
    if (category) {
      rule.category_affinity = category;
      parts.push(`mostly buys ${category}`);
    }

    if (Object.keys(rule).length === 0) {
      rule.recency_days = { "<=": 60 };
      parts.push("active in the last 60 days");
    }

    const name = req.prompt.length <= 40 ? capitalize(req.prompt) : capitalize(req.prompt.slice(0, 37)) + "…";
    return { name, description: `Customers with ${parts.join(", ")}.`, campaignType, rule };
  }

  /** A fixed playbook of retention segments, thresholded by the shop's own quartiles. */
  async discoverSegments(req: DiscoverSegmentsRequest): Promise<SegmentProposal[]> {
    const q = req.context.ltvQuartiles;
    const p75 = q[2] ?? 5000;
    const existing = new Set(req.existingSegmentNames.map((n) => n.toLowerCase()));
    const proposals: SegmentProposal[] = [
      {
        name: "High-value, drifting away",
        description: `Customers worth ₹${p75}+ lifetime who haven't visited in over a month — the most expensive customers to lose.`,
        campaignType: "winback",
        rule: { monetary_ltv: { ">=": p75 }, recency_days: { ">": 30, "<=": 120 } },
      },
      {
        name: "Champions",
        description: "Your most frequent recent buyers — reward them before a competitor does.",
        campaignType: "reorder_reminder",
        rule: { frequency_90d: { ">=": 4 }, recency_days: { "<=": 30 } },
      },
      {
        name: "Festival gifters",
        description: "Festival-window buyers with above-median spend — prime for a pre-order nudge with gift boxes.",
        campaignType: "festival_preorder",
        rule: { festival_buyer: true, monetary_ltv: { ">=": q[1] ?? 1000 } },
      },
      {
        name: "One-and-done",
        description: "Tried you once in the last few months and never came back — a small welcome-back gesture converts these cheaply.",
        campaignType: "winback",
        rule: { frequency_90d: { "<=": 1 }, recency_days: { ">": 21, "<=": 90 } },
      },
    ];
    return proposals.filter((s) => !existing.has(s.name.toLowerCase())).slice(0, 4);
  }

  async writeCounterPitch(req: PitchRequest): Promise<string> {
    const c = req.customer;
    const who = c.firstName ? `${c.firstName} ji` : "ji";
    const top = req.recommendations[0];
    const bits = [
      c.favoriteItem ? `Welcome back ${who} — fresh ${c.favoriteItem} just came out.` : `Welcome back ${who}!`,
      top ? `Do try the ${top.item} today — ${lc(top.reason)}.` : "",
      req.activeFestival ? `And ${req.activeFestival} is around the corner — gift boxes are ready.` : "",
      c.loyaltyBalance >= 100 ? `You have ${c.loyaltyBalance} points saved up, by the way.` : "",
    ].filter(Boolean);
    return bits.slice(0, 3).join(" ");
  }

  async writePricingRationale(req: PricingRationaleRequest): Promise<PricingRationaleResult[]> {
    return req.items.map((it) => {
      const occasionBit = req.occasion ? ` ahead of ${req.occasion}` : "";
      const rationale =
        it.demandTrend === "rising"
          ? `Selling more than usual lately${occasionBit} — a small increase captures demand without denting volume.`
          : it.demandTrend === "falling"
            ? `Sales have cooled off — a small cut can bring customers back.`
            : `Steady sales${occasionBit} — price left close to where it is.`;
      return { menuItemId: it.menuItemId, rationale };
    });
  }

  async writeInventoryRationale(req: InventoryRationaleRequest): Promise<InventoryRationaleResult[]> {
    return req.items.map((it) => {
      const rationale =
        it.daysOfStockLeft === null
          ? "Not enough sales history yet to estimate how long stock will last."
          : it.urgency === "high"
            ? `At current sales pace, stock runs out in about ${Math.round(it.daysOfStockLeft)} day(s) — reorder soon.`
            : it.urgency === "medium"
              ? `Stock is comfortable for now but worth planning a reorder soon.`
              : `Stock is well ahead of current sales pace.`;
      return { menuItemId: it.menuItemId, rationale };
    });
  }
}

function capitalize(s: string): string {
  const t = s.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function lc(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
