"use client";

// Inventory > Reorder Suggestions — the deterministic sales-velocity engine's
// output (packages/core/src/inventory.ts): days-of-stock-left, suggested
// order qty/date, urgency, and an optional AI rationale (only present when
// AI Assist is on for Pricing — see Settings). Manual override always wins;
// nothing reorders automatically.

import { useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import { api } from "../../../lib/api";
import InventoryLocked from "../locked";

interface ReorderSuggestion {
  menuItemId: string;
  name: string;
  currentQty: number;
  avgDailySales: number;
  daysOfStockLeft: number | null;
  suggestedOrderQty: number;
  suggestedOrderDate: string;
  urgency: "low" | "medium" | "high";
  rationale: string | null;
  manualOverrideQty: number | null;
  computedAt: string;
}

const URGENCY_BADGE: Record<string, string> = { high: "badge-rejected", medium: "badge-pending", low: "badge-sent" };

export default function InventoryReorderPage() {
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[] | null>(null);
  const [overrideDraft, setOverrideDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  function load() {
    api<{ suggestions: ReorderSuggestion[] }>("/inventory/reorder-suggestions")
      .then((r) => setSuggestions(r.suggestions))
      .catch((e: Error & { status?: number }) => {
        if (e.status === 403) setLocked(true);
        else setError(String(e.message ?? e));
      });
  }

  useEffect(load, []);

  async function recompute() {
    setRecomputing(true);
    setError("");
    try {
      const r = await api<{ suggestions: ReorderSuggestion[] }>("/inventory/reorder-suggestions/recompute", { method: "POST" });
      setSuggestions(r.suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRecomputing(false);
    }
  }

  async function saveOverride(menuItemId: string) {
    const raw = overrideDraft[menuItemId];
    const qty = raw === "" || raw === undefined ? null : Math.max(0, Number(raw));
    try {
      await api(`/inventory/reorder-suggestions/${menuItemId}/override`, {
        method: "PUT",
        body: JSON.stringify({ qty }),
      });
      load();
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

  return (
    <AppShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">Reorder Suggestions</div>
          <div className="page-sub">
            Based on your last 90 days of sales for tracked items. Override any suggested quantity —
            your number always wins.
          </div>
        </div>
        <button className="btn btn-primary" disabled={recomputing} onClick={recompute}>
          {recomputing ? "Recomputing…" : "Recompute now"}
        </button>
      </div>
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      {!suggestions ? (
        <div className="muted">Loading…</div>
      ) : suggestions.length === 0 ? (
        <div className="muted">
          No suggestions yet — track stock for some items on the <a href="/inventory">Items</a> page, then
          recompute.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th className="num">In stock</th>
              <th className="num">Avg/day</th>
              <th className="num">Days left</th>
              <th className="num">Suggested order</th>
              <th>By</th>
              <th>Urgency</th>
              <th>Override</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s) => (
              <tr key={s.menuItemId}>
                <td>{s.name}</td>
                <td className="num">{s.currentQty}</td>
                <td className="num">{s.avgDailySales.toFixed(2)}</td>
                <td className="num">{s.daysOfStockLeft === null ? "—" : s.daysOfStockLeft.toFixed(1)}</td>
                <td className="num">{s.manualOverrideQty ?? s.suggestedOrderQty}</td>
                <td className="muted">{s.suggestedOrderDate}</td>
                <td>
                  <span className={`badge ${URGENCY_BADGE[s.urgency]}`}>{s.urgency}</span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="number"
                      min={0}
                      placeholder={String(s.suggestedOrderQty)}
                      value={overrideDraft[s.menuItemId] ?? (s.manualOverrideQty ?? "")}
                      onChange={(e) => setOverrideDraft({ ...overrideDraft, [s.menuItemId]: e.target.value })}
                      style={{ width: 80 }}
                    />
                    <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => saveOverride(s.menuItemId)}>
                      Save
                    </button>
                  </div>
                </td>
                <td className="muted" style={{ maxWidth: 260 }}>{s.rationale ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
