"use client";

// Pricing > Item Settings — which items to optimize (or all of them), the
// tenant-wide default max %-change, an optional occasion tie-in, per-item
// min/max price + max %-change overrides, plus rounding and the safety-net
// review flag — laid out as a grid of cards.

import { useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import BusinessUnitsCard from "../../../components/BusinessUnitsCard";
import { api, getSession } from "../../../lib/api";
import { useBusinessUnits } from "../../../lib/businessUnits";
import PricingLocked from "../locked";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

type RoundingRule = "none" | "nearest_5" | "nearest_10" | "end_99" | "end_95";

interface PricingItemConfig {
  enabled: boolean;
  minPrice?: number;
  maxPrice?: number;
  maxChangePercent?: number;
  manualOverride?: boolean;
}

interface PricingConfig {
  applyToAllItems: boolean;
  defaultMaxChangePercent: number;
  occasion?: string;
  roundingRule?: RoundingRule;
  safetyNetEnabled?: boolean;
  useBusinessUnitsInPricing?: boolean;
  items: Record<string, PricingItemConfig>;
}

const ROUNDING_OPTIONS: Array<{ value: RoundingRule; label: string; example: string }> = [
  { value: "none", label: "No rounding", example: "₹123.40 stays ₹123.40" },
  { value: "nearest_5", label: "Nearest ₹5", example: "₹123.40 → ₹125" },
  { value: "nearest_10", label: "Nearest ₹10", example: "₹123.40 → ₹120" },
  { value: "end_99", label: "End in .99", example: "₹123.40 → ₹119.99" },
  { value: "end_95", label: "End in .95", example: "₹123.40 → ₹119.95" },
];

export default function PricingSettingsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null);
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const festivals = getSession()?.tenant.config.festivals ?? [];
  const { active: businessUnitsActive } = useBusinessUnits();

  useEffect(() => {
    api<{ items: MenuItem[] }>("/menu")
      .then((r) => setMenuItems(r.items))
      .catch((e) => setError(String(e.message ?? e)));
    api<{ pricing: PricingConfig }>("/settings/pricing")
      .then((r) => setConfig(r.pricing))
      .catch((e: Error & { status?: number }) => {
        if (e.status === 403) setLocked(true);
        else setError(String(e.message ?? e));
      });
  }, []);

  async function saveConfig(next: PricingConfig) {
    setConfig(next);
    setSaving(true);
    setError("");
    try {
      await api("/settings/pricing", { method: "PUT", body: JSON.stringify({ pricing: next }) });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function setItemConfig(itemId: string, patch: Partial<PricingItemConfig>) {
    if (!config) return;
    const base: PricingItemConfig = config.items[itemId] ?? { enabled: false };
    const nextItems = {
      ...config.items,
      [itemId]: { ...base, ...patch },
    };
    saveConfig({ ...config, items: nextItems });
  }

  if (locked) {
    return (
      <AppShell>
        <PricingLocked />
      </AppShell>
    );
  }

  if (!menuItems || !config) {
    return (
      <AppShell>
        <div className="page-title">Pricing Item Settings</div>
        {error ? <div className="error-text">{error}</div> : <div className="muted">Loading…</div>}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-title">Pricing Item Settings</div>
      <div className="page-sub">
        Which items to optimize and within what bounds. See <a href="/pricing">Recommendations</a> to refresh
        and apply suggestions.{saving ? " · saving…" : ""}
      </div>
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Rounding Rule</div>
          <div className="muted" style={{ marginBottom: 12, fontSize: "0.9rem" }}>
            Applied to every suggested price as the last step, after your min/max bounds.
          </div>
          <select
            value={config.roundingRule ?? "none"}
            onChange={(e) => saveConfig({ ...config, roundingRule: e.target.value as RoundingRule })}
            style={{ width: "100%", marginBottom: 8 }}
          >
            {ROUNDING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="muted" style={{ fontSize: "0.85rem" }}>
            {ROUNDING_OPTIONS.find((o) => o.value === (config.roundingRule ?? "none"))?.example}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Safety Net</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.safetyNetEnabled ?? true}
                onChange={(e) => saveConfig({ ...config, safetyNetEnabled: e.target.checked })}
              />
              <span className="slider" />
            </label>
            <span>Flag recommendations that need review</span>
          </div>
          <div className="muted" style={{ fontSize: "0.9rem" }}>
            When on, any recommendation built on thin sales data or that hit its min/max
            bound is marked "needs review" on the Recommendations page and can&apos;t be
            applied without an explicit confirmation.
          </div>
        </div>

        {businessUnitsActive && (
          <div className="card">
            <div className="section-title">Business Units in Pricing</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={config.useBusinessUnitsInPricing ?? false}
                  onChange={(e) => saveConfig({ ...config, useBusinessUnitsInPricing: e.target.checked })}
                />
                <span className="slider" />
              </label>
              <span>Optimize per branch</span>
            </div>
            <div className="muted" style={{ fontSize: "0.9rem" }}>
              On: Recommendations gets a branch selector — refresh and apply are scoped to one
              branch's own sales and price, so a slow branch never drags a fast one's price
              around. Off: pricing ignores Business Units entirely and always optimizes across
              all branches, exactly like a tenant with no Business Units configured.
            </div>
          </div>
        )}

        <BusinessUnitsCard />
      </div>

      <div className="card">
        <div className="section-title">Item Bounds</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <label className="toggle">
            <input
              type="checkbox"
              checked={config.applyToAllItems}
              onChange={(e) => saveConfig({ ...config, applyToAllItems: e.target.checked })}
            />
            <span className="slider" />
          </label>
          <span>Optimize all items</span>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 4 }}>
              Default max change
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={config.defaultMaxChangePercent}
              onChange={(e) => saveConfig({ ...config, defaultMaxChangePercent: Number(e.target.value) || 0 })}
              style={{ width: 90 }}
            />
          </div>
          <div>
            <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 4 }}>
              Occasion (optional)
            </div>
            <select
              value={config.occasion ?? ""}
              onChange={(e) => saveConfig({ ...config, occasion: e.target.value || undefined })}
              style={{ width: 200 }}
            >
              <option value="">None</option>
              {festivals.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!config.applyToAllItems && (
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Item</th>
                <th className="num">Current price</th>
                <th className="num">Min ₹</th>
                <th className="num">Max ₹</th>
                <th className="num">Max change %</th>
                <th>Manual pricing</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => {
                const ic = config.items[item.id];
                const manual = Boolean(ic?.manualOverride);
                return (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={Boolean(ic?.enabled)}
                        onChange={(e) => setItemConfig(item.id, { enabled: e.target.checked })}
                      />
                    </td>
                    <td>{item.name} <span className="muted">{item.category}</span></td>
                    <td className="num">₹{item.price}</td>
                    <td className="num">
                      <input
                        type="number"
                        min={0}
                        disabled={manual}
                        value={ic?.minPrice ?? ""}
                        onChange={(e) => setItemConfig(item.id, { minPrice: e.target.value ? Number(e.target.value) : undefined })}
                        style={{ width: 80, opacity: manual ? 0.5 : 1 }}
                      />
                    </td>
                    <td className="num">
                      <input
                        type="number"
                        min={0}
                        disabled={manual}
                        value={ic?.maxPrice ?? ""}
                        onChange={(e) => setItemConfig(item.id, { maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                        style={{ width: 80, opacity: manual ? 0.5 : 1 }}
                      />
                    </td>
                    <td className="num">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={manual}
                        value={ic?.maxChangePercent ?? ""}
                        onChange={(e) =>
                          setItemConfig(item.id, { maxChangePercent: e.target.value ? Number(e.target.value) : undefined })
                        }
                        style={{ width: 70, opacity: manual ? 0.5 : 1 }}
                      />
                    </td>
                    <td>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={manual}
                          onChange={(e) => setItemConfig(item.id, { manualOverride: e.target.checked })}
                        />
                        <span className="slider" />
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="muted" style={{ fontSize: "0.85rem", marginTop: 10 }}>
          Manual pricing skips AI recommendations for that item — set its price yourself on{" "}
          <a href="/menu">Master Data</a>.
        </div>
      </div>
    </AppShell>
  );
}
