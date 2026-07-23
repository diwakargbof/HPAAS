"use client";

// Pricing > Dashboard — a tenant-configurable widget board, mirroring
// Personalization's. No new data queries: every widget renders from the
// existing /pricing/recommendations, /menu, and /settings/pricing
// responses. Layout persists via /settings/pricing-dashboard.

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppShell from "../../../components/AppShell";
import { api } from "../../../lib/api";
import PricingLocked from "../locked";

type WidgetType = "recommendation_summary" | "demand_trend_chart" | "top_movers" | "needs_review_list" | "pricing_config_summary";

interface Widget {
  id: string;
  type: WidgetType;
  title?: string;
}

interface DashboardConfig {
  widgets: Widget[];
}

interface Recommendation {
  menuItemId: string;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  changePercent: number;
  demandTrend: "rising" | "falling" | "flat";
  confidence: "low" | "medium" | "high";
  needsReview: boolean;
}

interface PricingConfig {
  applyToAllItems: boolean;
  defaultMaxChangePercent: number;
  occasion?: string;
  roundingRule?: string;
  safetyNetEnabled?: boolean;
}

const WIDGET_CATALOG: Array<{ type: WidgetType; label: string; description: string }> = [
  { type: "recommendation_summary", label: "Recommendation Summary", description: "How many items have suggestions, and the average change" },
  { type: "demand_trend_chart", label: "Demand Trend Chart", description: "Rising vs. falling vs. flat items, at a glance" },
  { type: "top_movers", label: "Top Movers", description: "Items with the biggest suggested price change" },
  { type: "needs_review_list", label: "Needs Review", description: "Recommendations flagged by the safety net" },
  { type: "pricing_config_summary", label: "Pricing Settings Summary", description: "Your current rounding rule, safety net, and bounds" },
];

const WIDGET_LABEL: Record<WidgetType, string> = Object.fromEntries(
  WIDGET_CATALOG.map((w) => [w.type, w.label])
) as Record<WidgetType, string>;

const TREND_COLOR: Record<string, string> = { rising: "#2e7d32", falling: "#c62828", flat: "#8a8178" };

function newWidgetId(): string {
  return `widget-${Math.random().toString(36).slice(2, 10)}`;
}

export default function PricingDashboardPage() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    api<{ dashboard: DashboardConfig }>("/settings/pricing-dashboard")
      .then((r) => setConfig(r.dashboard))
      .catch((e: Error & { status?: number }) => {
        if (e.status === 403) setLocked(true);
        else setError(String(e.message ?? e));
      });
    api<{ recommendations: Recommendation[] }>("/pricing/recommendations")
      .then((r) => setRecommendations(r.recommendations))
      .catch(() => setRecommendations([]));
    api<{ pricing: PricingConfig }>("/settings/pricing")
      .then((r) => setPricingConfig(r.pricing))
      .catch(() => {});
  }, []);

  async function saveConfig(next: DashboardConfig) {
    setConfig(next);
    try {
      await api("/settings/pricing-dashboard", { method: "PUT", body: JSON.stringify({ dashboard: next }) });
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
        <PricingLocked />
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

    if (widget.type === "recommendation_summary") {
      if (!recommendations) return null;
      const rising = recommendations.filter((r) => r.demandTrend === "rising").length;
      const falling = recommendations.filter((r) => r.demandTrend === "falling").length;
      const needsReview = recommendations.filter((r) => r.needsReview).length;
      const avgChange =
        recommendations.length > 0
          ? recommendations.reduce((sum, r) => sum + r.changePercent, 0) / recommendations.length
          : 0;
      return (
        <div className="card" key={widget.id}>
          {header}
          <div className="grid grid-4" style={{ marginBottom: 0 }}>
            <div>
              <div className="stat-label">Items with suggestions</div>
              <div className="stat-value">{recommendations.length}</div>
            </div>
            <div>
              <div className="stat-label">Avg. suggested change</div>
              <div className="stat-value">{avgChange >= 0 ? "+" : ""}{avgChange.toFixed(1)}%</div>
            </div>
            <div>
              <div className="stat-label">Rising / falling demand</div>
              <div className="stat-value">
                <span className="good-text">{rising}</span> / <span style={{ color: "var(--bad)" }}>{falling}</span>
              </div>
            </div>
            <div>
              <div className="stat-label">Needs review</div>
              <div className="stat-value">{needsReview}</div>
            </div>
          </div>
        </div>
      );
    }

    if (widget.type === "demand_trend_chart") {
      if (!recommendations) return null;
      const data = ["rising", "flat", "falling"].map((trend) => ({
        trend,
        count: recommendations.filter((r) => r.demandTrend === trend).length,
      }));
      return (
        <div className="card" key={widget.id}>
          {header}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="trend" tick={{ fontSize: 12, fill: "#8a8178" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#8a8178" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #eee5da", fontSize: 13 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.trend} fill={TREND_COLOR[d.trend]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (widget.type === "top_movers") {
      if (!recommendations) return null;
      const top = [...recommendations].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 8);
      return (
        <div className="card" key={widget.id}>
          {header}
          {top.length === 0 ? (
            <div className="muted">No recommendations yet — refresh from the Recommendations page.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">Current</th>
                  <th className="num">Suggested</th>
                  <th className="num">Change</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r) => (
                  <tr key={r.menuItemId}>
                    <td>{r.name}</td>
                    <td className="num">₹{r.currentPrice}</td>
                    <td className="num">₹{r.suggestedPrice}</td>
                    <td className="num" style={{ color: r.changePercent >= 0 ? "var(--good)" : "var(--bad)" }}>
                      {r.changePercent >= 0 ? "+" : ""}{r.changePercent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (widget.type === "needs_review_list") {
      if (!recommendations) return null;
      const flagged = recommendations.filter((r) => r.needsReview);
      return (
        <div className="card" key={widget.id}>
          {header}
          {flagged.length === 0 ? (
            <div className="muted">Nothing flagged right now.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Confidence</th>
                  <th className="num">Suggested</th>
                </tr>
              </thead>
              <tbody>
                {flagged.map((r) => (
                  <tr key={r.menuItemId}>
                    <td>{r.name}</td>
                    <td className="muted">{r.confidence}</td>
                    <td className="num">₹{r.suggestedPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="muted" style={{ fontSize: "0.85rem", marginTop: 10 }}>
            Review and apply on the <a href="/pricing">Recommendations</a> page.
          </div>
        </div>
      );
    }

    if (widget.type === "pricing_config_summary") {
      if (!pricingConfig) return null;
      return (
        <div className="card" key={widget.id}>
          {header}
          <div className="grid grid-4" style={{ marginBottom: 0 }}>
            <div>
              <div className="stat-label">Mode</div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>
                {pricingConfig.applyToAllItems ? "All items" : "Selected items"}
              </div>
            </div>
            <div>
              <div className="stat-label">Default max change</div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>{pricingConfig.defaultMaxChangePercent}%</div>
            </div>
            <div>
              <div className="stat-label">Rounding</div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>{pricingConfig.roundingRule ?? "none"}</div>
            </div>
            <div>
              <div className="stat-label">Safety net</div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>{pricingConfig.safetyNetEnabled ?? true ? "On" : "Off"}</div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <AppShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">Pricing Dashboard</div>
          <div className="page-sub">Pick your own widgets — summaries, charts, and lists, built from your pricing data.</div>
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
