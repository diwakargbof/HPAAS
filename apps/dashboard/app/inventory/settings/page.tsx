"use client";

// Inventory > Settings — tenant-wide defaults (lead time, safety stock,
// low-stock threshold, auto-decrement) plus per-item overrides for lead
// time and reorder point. Same shape as pricing/settings/page.tsx.

import { useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import { api } from "../../../lib/api";
import InventoryLocked from "../locked";

interface InventoryConfig {
  defaultLeadTimeDays: number;
  defaultSafetyStockDays: number;
  lowStockThresholdDays: number;
  autoDecrementFromSales: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  trackStock: boolean;
  unit: string;
  reorderPoint: number | null;
  leadTimeDays: number | null;
}

export default function InventorySettingsPage() {
  const [config, setConfig] = useState<InventoryConfig | null>(null);
  const [items, setItems] = useState<InventoryItem[] | null>(null);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ inventory: InventoryConfig }>("/settings/inventory")
      .then((r) => setConfig(r.inventory))
      .catch((e: Error & { status?: number }) => {
        if (e.status === 403) setLocked(true);
        else setError(String(e.message ?? e));
      });
    api<{ items: InventoryItem[] }>("/inventory/items")
      .then((r) => setItems(r.items.filter((i) => i.trackStock)))
      .catch(() => {});
  }, []);

  async function saveConfig(next: InventoryConfig) {
    setConfig(next);
    setSaving(true);
    setError("");
    try {
      await api("/settings/inventory", { method: "PUT", body: JSON.stringify({ inventory: next }) });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function saveItemOverride(id: string, patch: { reorderPoint?: number | null; leadTimeDays?: number | null }) {
    try {
      await api(`/inventory/items/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      const r = await api<{ items: InventoryItem[] }>("/inventory/items");
      setItems(r.items.filter((i) => i.trackStock));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (locked) {
    return (
      <AppShell>
        <InventoryLocked />
      </AppShell>
    );
  }

  if (!config) {
    return (
      <AppShell>
        <div className="page-title">Inventory Settings</div>
        {error ? <div className="error-text">{error}</div> : <div className="muted">Loading…</div>}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-title">Inventory Settings</div>
      <div className="page-sub">
        Defaults used when an item has no override of its own.{saving ? " · saving…" : ""}
      </div>
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-title">Reorder Defaults</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Default lead time (days)</div>
              <input
                type="number"
                min={0}
                value={config.defaultLeadTimeDays}
                onChange={(e) => saveConfig({ ...config, defaultLeadTimeDays: Math.max(0, Number(e.target.value) || 0) })}
                style={{ width: 90 }}
              />
            </div>
            <div>
              <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Default safety stock (days)</div>
              <input
                type="number"
                min={0}
                value={config.defaultSafetyStockDays}
                onChange={(e) => saveConfig({ ...config, defaultSafetyStockDays: Math.max(0, Number(e.target.value) || 0) })}
                style={{ width: 90 }}
              />
            </div>
            <div>
              <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Low-stock alert threshold (days)</div>
              <input
                type="number"
                min={0}
                value={config.lowStockThresholdDays}
                onChange={(e) => saveConfig({ ...config, lowStockThresholdDays: Math.max(0, Number(e.target.value) || 0) })}
                style={{ width: 90 }}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Auto-Decrement</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.autoDecrementFromSales}
                onChange={(e) => saveConfig({ ...config, autoDecrementFromSales: e.target.checked })}
              />
              <span className="slider" />
            </label>
            <span>Decrement stock automatically from sales</span>
          </div>
          <div className="muted" style={{ fontSize: "0.9rem" }}>
            When on, every purchase of a tracked item deducts from its stock count as sales come in,
            matched by item name — the same way sales already feed Pricing. When off, stock only
            changes from manual adjustments and restocks.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Per-Item Overrides</div>
        {!items ? (
          <div className="muted">Loading…</div>
        ) : items.length === 0 ? (
          <div className="muted">No tracked items yet — turn on tracking for items on the <a href="/inventory">Items</a> page.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Reorder point</th>
                <th className="num">Lead time (days)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td className="num">
                    <input
                      type="number"
                      min={0}
                      placeholder="auto"
                      defaultValue={item.reorderPoint ?? ""}
                      onBlur={(e) =>
                        saveItemOverride(item.id, {
                          reorderPoint: e.target.value === "" ? null : Math.max(0, Number(e.target.value)),
                        })
                      }
                      style={{ width: 90 }}
                    />
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      min={0}
                      placeholder="default"
                      defaultValue={item.leadTimeDays ?? ""}
                      onBlur={(e) =>
                        saveItemOverride(item.id, {
                          leadTimeDays: e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))),
                        })
                      }
                      style={{ width: 90 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
