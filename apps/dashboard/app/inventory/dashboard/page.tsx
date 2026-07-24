"use client";

// Inventory > Dashboard — a tenant-configurable widget board, same pattern
// as Pricing's. No new data queries beyond what Items/Reorder Suggestions
// already expose: every widget renders from /inventory/reorder-suggestions,
// /inventory/items, and /inventory/ledger. Layout persists via
// /settings/inventory-dashboard.

import { useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import { api } from "../../../lib/api";
import InventoryLocked from "../locked";

type WidgetType = "low_stock_alerts" | "days_of_stock_leaderboard" | "reorder_queue" | "recent_adjustments" | "top_movers";

interface Widget {
  id: string;
  type: WidgetType;
  title?: string;
}

interface DashboardConfig {
  widgets: Widget[];
}

interface ReorderSuggestion {
  menuItemId: string;
  name: string;
  currentQty: number;
  avgDailySales: number;
  daysOfStockLeft: number | null;
  suggestedOrderQty: number;
  suggestedOrderDate: string;
  urgency: "low" | "medium" | "high";
  manualOverrideQty: number | null;
}

interface LedgerEntry {
  id: string;
  menuItemId: string;
  delta: number;
  source: "sale" | "manual" | "restock";
  reason: string;
  createdAt: string;
}

const WIDGET_CATALOG: Array<{ type: WidgetType; label: string; description: string }> = [
  { type: "low_stock_alerts", label: "Low Stock Alerts", description: "Items at high urgency, running out soonest" },
  { type: "days_of_stock_leaderboard", label: "Days-of-Stock-Left Leaderboard", description: "Every tracked item, sorted by runway" },
  { type: "reorder_queue", label: "Reorder Queue", description: "What to order next and how much" },
  { type: "recent_adjustments", label: "Recent Stock Adjustments", description: "Latest sales, manual edits, and restocks" },
  { type: "top_movers", label: "Top Movers", description: "Highest average daily sales among tracked items" },
];

const WIDGET_LABEL: Record<WidgetType, string> = Object.fromEntries(
  WIDGET_CATALOG.map((w) => [w.type, w.label])
) as Record<WidgetType, string>;

const URGENCY_BADGE: Record<string, string> = { high: "badge-rejected", medium: "badge-pending", low: "badge-sent" };

function newWidgetId(): string {
  return `widget-${Math.random().toString(36).slice(2, 10)}`;
}

export default function InventoryDashboardPage() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[] | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[] | null>(null);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    api<{ dashboard: DashboardConfig }>("/settings/inventory-dashboard")
      .then((r) => setConfig(r.dashboard))
      .catch((e: Error & { status?: number }) => {
        if (e.status === 403) setLocked(true);
        else setError(String(e.message ?? e));
      });
    api<{ suggestions: ReorderSuggestion[] }>("/inventory/reorder-suggestions")
      .then((r) => setSuggestions(r.suggestions))
      .catch(() => setSuggestions([]));
    api<{ ledger: LedgerEntry[] }>("/inventory/ledger")
      .then((r) => setLedger(r.ledger))
      .catch(() => setLedger([]));
  }, []);

  async function saveConfig(next: DashboardConfig) {
    setConfig(next);
    try {
      await api("/settings/inventory-dashboard", { method: "PUT", body: JSON.stringify({ dashboard: next }) });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function addWidget(type: WidgetType) {
    if (!config) return;
    saveConfig({ widgets: [...config.widgets, { id: newWidgetId(), type }] });
    setPickerOpen(false);
  }

  function removeWidget(id: string) {
    if (!config) return;
    saveConfig({ widgets: config.widgets.filter((w) => w.id !== id) });
  }

  function moveWidget(id: string, dir: -1 | 1) {
    if (!config) return;
    const i = config.widgets.findIndex((w) => w.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= config.widgets.length) return;
    const widgets = [...config.widgets];
    [widgets[i], widgets[j]] = [widgets[j], widgets[i]];
    saveConfig({ widgets });
  }

  if (locked) {
    return (
      <AppShell>
        <InventoryLocked />
      </AppShell>
    );
  }

  function renderWidget(widget: Widget, index: number) {
    const title = widget.title || WIDGET_LABEL[widget.type];
    const controls = (
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-ghost" style={{ padding: "4px 8px" }} disabled={index === 0} onClick={() => moveWidget(widget.id, -1)}>
          ↑
        </button>
        <button
          className="btn btn-ghost"
          style={{ padding: "4px 8px" }}
          disabled={index === (config?.widgets.length ?? 0) - 1}
          onClick={() => moveWidget(widget.id, 1)}
        >
          ↓
        </button>
        <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => removeWidget(widget.id)}>
          ×
        </button>
      </div>
    );
    const header = (
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>{title}</div>
        {controls}
      </div>
    );

    if (widget.type === "low_stock_alerts") {
      if (!suggestions) return null;
      const flagged = suggestions.filter((s) => s.urgency === "high");
      return (
        <div className="card" key={widget.id}>
          {header}
          {flagged.length === 0 ? (
            <div className="muted">Nothing urgent right now.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">Days left</th>
                  <th className="num">Suggested order</th>
                </tr>
              </thead>
              <tbody>
                {flagged.map((s) => (
                  <tr key={s.menuItemId}>
                    <td>{s.name}</td>
                    <td className="num">{s.daysOfStockLeft?.toFixed(1) ?? "—"}</td>
                    <td className="num">{s.manualOverrideQty ?? s.suggestedOrderQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (widget.type === "days_of_stock_leaderboard") {
      if (!suggestions) return null;
      const sorted = [...suggestions].sort((a, b) => (a.daysOfStockLeft ?? Infinity) - (b.daysOfStockLeft ?? Infinity));
      return (
        <div className="card" key={widget.id}>
          {header}
          {sorted.length === 0 ? (
            <div className="muted">No tracked items with sales history yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">Days left</th>
                  <th>Urgency</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr key={s.menuItemId}>
                    <td>{s.name}</td>
                    <td className="num">{s.daysOfStockLeft?.toFixed(1) ?? "—"}</td>
                    <td>
                      <span className={`badge ${URGENCY_BADGE[s.urgency]}`}>{s.urgency}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (widget.type === "reorder_queue") {
      if (!suggestions) return null;
      const queue = suggestions.filter((s) => (s.manualOverrideQty ?? s.suggestedOrderQty) > 0);
      return (
        <div className="card" key={widget.id}>
          {header}
          {queue.length === 0 ? (
            <div className="muted">Nothing to reorder right now.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">Order qty</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((s) => (
                  <tr key={s.menuItemId}>
                    <td>{s.name}</td>
                    <td className="num">{s.manualOverrideQty ?? s.suggestedOrderQty}</td>
                    <td className="muted">{s.suggestedOrderDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="muted" style={{ fontSize: "0.85rem", marginTop: 10 }}>
            Review and override on <a href="/inventory/reorder">Reorder Suggestions</a>.
          </div>
        </div>
      );
    }

    if (widget.type === "recent_adjustments") {
      if (!ledger) return null;
      return (
        <div className="card" key={widget.id}>
          {header}
          {ledger.length === 0 ? (
            <div className="muted">No stock movements yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Source</th>
                  <th className="num">Change</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {ledger.slice(0, 10).map((e) => (
                  <tr key={e.id}>
                    <td className="muted">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="muted">{e.source}</td>
                    <td className="num" style={{ color: e.delta >= 0 ? "var(--good)" : "var(--bad)" }}>
                      {e.delta >= 0 ? "+" : ""}{e.delta}
                    </td>
                    <td className="muted">{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (widget.type === "top_movers") {
      if (!suggestions) return null;
      const top = [...suggestions].sort((a, b) => b.avgDailySales - a.avgDailySales).slice(0, 8);
      return (
        <div className="card" key={widget.id}>
          {header}
          {top.length === 0 ? (
            <div className="muted">No sales history for tracked items yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">Avg units/day</th>
                </tr>
              </thead>
              <tbody>
                {top.map((s) => (
                  <tr key={s.menuItemId}>
                    <td>{s.name}</td>
                    <td className="num">{s.avgDailySales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    return null;
  }

  return (
    <AppShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">Inventory Dashboard</div>
          <div className="page-sub">Pick your own widgets — alerts, leaderboards, and queues, built from your stock data.</div>
        </div>
        <div style={{ position: "relative" }}>
          <button className="btn btn-primary" onClick={() => setPickerOpen((o) => !o)}>
            + Widget
          </button>
          {pickerOpen && (
            <div className="card" style={{ position: "absolute", right: 0, top: 44, zIndex: 10, width: 280, padding: 10 }}>
              {WIDGET_CATALOG.map((w) => (
                <div
                  key={w.type}
                  onClick={() => addWidget(w.type)}
                  style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ fontWeight: 600 }}>{w.label}</div>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>{w.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      {!config ? (
        <div className="muted">Loading…</div>
      ) : config.widgets.length === 0 ? (
        <div className="muted">No widgets yet — add one with the button above.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {config.widgets.map((w, i) => renderWidget(w, i))}
        </div>
      )}
    </AppShell>
  );
}
