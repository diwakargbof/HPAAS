// Segment rules are JSON stored in the DB, compiled here to a parameterized
// WHERE clause over the features table. Columns and operators are strictly
// whitelisted — a rule can never inject SQL or escape its tenant scope
// (selectAudience always prepends tenant_id = $1).

import type { CampaignType, Features, Segment, SegmentRule, Tenant } from "@hpas/types";
import { selectAudience, upsertSegment } from "@hpas/db";

const COLUMNS = new Set([
  "recency_days",
  "frequency_90d",
  "monetary_ltv",
  "category_affinity",
  "festival_buyer",
  "reorder_cadence_days",
  "favorite_item",
]);

const OPERATORS: Record<string, string> = {
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<=",
  "=": "=",
  "!=": "<>",
};

export function compileRule(rule: SegmentRule): { whereSql: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  // $1 is reserved for tenant_id in selectAudience
  const next = () => `$${params.length + 2}`;

  for (const [column, condition] of Object.entries(rule)) {
    if (!COLUMNS.has(column)) throw new Error(`rule references unknown column "${column}"`);

    if (typeof condition !== "object" || condition === null) {
      params.push(condition);
      clauses.push(`${column} = ${next()}`);
      continue;
    }

    for (const [op, value] of Object.entries(condition)) {
      if (op === "in") {
        if (!Array.isArray(value)) throw new Error(`"in" needs an array`);
        params.push(value);
        clauses.push(`${column} = ANY(${next()})`);
      } else if (op === "gte_col" || op === "lte_col") {
        // Compare against another features column, e.g. recency_days >= reorder_cadence_days
        const other = String(value);
        if (!COLUMNS.has(other)) throw new Error(`rule references unknown column "${other}"`);
        clauses.push(`${column} ${op === "gte_col" ? ">=" : "<="} ${other}`);
      } else if (OPERATORS[op]) {
        params.push(value);
        clauses.push(`${column} ${OPERATORS[op]} ${next()}`);
      } else {
        throw new Error(`unknown operator "${op}"`);
      }
    }
  }

  return { whereSql: clauses.join(" AND "), params };
}

/** Resolve a segment to its current audience from the precomputed features table. */
export async function audienceForSegment(tenant: Tenant, segment: Segment): Promise<Features[]> {
  const { whereSql, params } = compileRule(segment.rule);
  return selectAudience(tenant.id, whereSql, params);
}

/** The four standard pilot segments. Seeded per tenant; entirely data, not code. */
export const STANDARD_SEGMENTS: Array<{
  name: string;
  rule: SegmentRule;
  campaignType: CampaignType;
}> = [
  {
    name: "Lapsed 60-90 days",
    rule: { recency_days: { ">": 60, "<=": 90 } },
    campaignType: "winback",
  },
  {
    name: "Festival buyers",
    rule: { festival_buyer: true },
    campaignType: "festival_preorder",
  },
  {
    name: "Sweets lovers (new item alerts)",
    rule: { category_affinity: { in: ["sweets", "gift-boxes"] }, recency_days: { "<=": 120 } },
    campaignType: "new_item_alert",
  },
  {
    name: "Regulars due for reorder",
    rule: { frequency_90d: { ">=": 2 }, recency_days: { gte_col: "reorder_cadence_days" } },
    campaignType: "reorder_reminder",
  },
];

export async function seedStandardSegments(tenantId: string): Promise<void> {
  for (const s of STANDARD_SEGMENTS) {
    await upsertSegment(tenantId, s.name, s.rule, s.campaignType);
  }
}
