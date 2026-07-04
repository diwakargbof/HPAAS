// Call-list "channel": high-value lapsed customers get a human phone call
// instead of a broadcast message. Produces a CSV + per-customer talking
// points built from their actual history (favorite item, last visit).

import type { Features, Profile, Tenant } from "@hpas/types";

export interface CallListEntry {
  profile: Profile;
  features: Features;
  redemptionCode: string | null;
}

export function buildCallListCsv(tenant: Tenant, entries: CallListEntry[]): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const header = [
    "Name",
    "Phone",
    "Lifetime Value (₹)",
    "Days Since Last Visit",
    "Favorite Item",
    "Redemption Code",
    "Talking Points",
  ];
  const rows = entries.map(({ profile, features, redemptionCode }) => {
    const name = typeof profile.traits.name === "string" ? profile.traits.name : "";
    return [
      name,
      profile.phone,
      String(Math.round(features.monetaryLtv)),
      String(features.recencyDays),
      features.favoriteItem ?? "",
      redemptionCode ?? "",
      talkingPoints(tenant, name, features),
    ];
  });
  return [header, ...rows].map((r) => r.map(esc).join(",")).join("\n") + "\n";
}

function talkingPoints(tenant: Tenant, name: string, f: Features): string {
  const shop = tenant.config.branding.shopName;
  const first = name.split(" ")[0] || "ji";
  const lines = [
    `Greet ${first} warmly as a valued ${shop} customer (₹${Math.round(f.monetaryLtv)} lifetime).`,
    `It's been ${f.recencyDays} days since their last visit — ask how they've been, no hard sell.`,
    f.favoriteItem
      ? `Mention their favorite, ${f.favoriteItem}, is fresh — offer to set some aside.`
      : `Ask what they usually enjoy and offer to set it aside.`,
    `If interested, share their personal code for a small welcome-back treat.`,
  ];
  return lines.join(" | ");
}
