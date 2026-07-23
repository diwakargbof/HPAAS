"use client";

// Pricing > Item Settings — which items to optimize (or all of them), the
// tenant-wide default max %-change, an optional occasion tie-in, and
// per-item min/max price + max %-change overrides.

import { useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import { api, getSession } from "../../../lib/api";
import PricingLocked from "../locked";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

interface PricingItemConfig {
  enabled: boolean;
  minPrice?: number;
  maxPrice?: number;
  maxChangePercent?: number;
}

interface PricingConfig {
  applyToAllItems: boolean;
  defaultMaxChangePercent: number;
  occasion?: string;
  items: Record<string, PricingItemConfig>;
}

export default function PricingSettingsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null);
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const festivals = getSession()?.tenant.config.festivals ?? [];

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
        and apply suggestions.
      </div>
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <label className="toggle">
            <input
              type="checkbox"
              checked={config.applyToAllItems}
              onChange={(e) => saveConfig({ ...config, applyToAllItems: e.target.checked })}
            />
            <span className="slider" />
          </label>
          <span>Optimize all items{saving ? " · saving…" : ""}</span>
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
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => {
                const ic = config.items[item.id];
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
                        value={ic?.minPrice ?? ""}
                        onChange={(e) => setItemConfig(item.id, { minPrice: e.target.value ? Number(e.target.value) : undefined })}
                        style={{ width: 80 }}
                      />
                    </td>
                    <td className="num">
                      <input
                        type="number"
                        min={0}
                        value={ic?.maxPrice ?? ""}
                        onChange={(e) => setItemConfig(item.id, { maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                        style={{ width: 80 }}
                      />
                    </td>
                    <td className="num">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={ic?.maxChangePercent ?? ""}
                        onChange={(e) =>
                          setItemConfig(item.id, { maxChangePercent: e.target.value ? Number(e.target.value) : undefined })
                        }
                        style={{ width: 70 }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
