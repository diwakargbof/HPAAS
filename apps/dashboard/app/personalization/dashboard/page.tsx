"use client";

// Personalization > Dashboard — a tenant-configurable widget board. No new
// data queries: every widget renders from the existing /insights and
// /campaigns responses (campaign A/B compare is literally the
// messaged-vs-hold-out-control attribution already computed by
// computeAttribution). The tenant picks, orders, and removes widgets from a
// small catalog; layout persists via /settings/personalization-dashboard.

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppShell from "../../../components/AppShell";
import { api, getSession } from "../../../lib/api";

type WidgetType =
  | "customer_stats"
  | "repeat_trend"
  | "segment_sizes"
  | "top_customers"
  | "campaign_ab_compare"
  | "campaign_impact";

interface Widget {
  id: string;
  type: WidgetType;
  title?: string;
  config?: { campaignId?: string };
}

interface DashboardConfig {
  widgets: Widget[];
}

interface Insights {
  customers: { total: number; active: number; lapsed: number; avgLtv: number };
  segments: Array<{ id: string; name: string; campaignType: string; size: number }>;
  topCustomers: Array<{ name: string; phone: string; ltv: number; recencyDays: number; favoriteItem: string | null }>;
  repeatTrend: Array<{ month: string; buyers: number; repeatRate: number }>;
  impact: { sentCampaigns: number; incrementalRevenue: number; redemptions: number };
}

interface AttributionReport {
  messagedCount: number;
  controlCount: number;
  messagedRepeatRate: number;
  controlRepeatRate: number;
  messagedRevenuePerCustomer: number;
  controlRevenuePerCustomer: number;
  redemptions: number;
}

interface CampaignItem {
  id: string;
  status: string;
  createdAt: string;
  segmentName: string;
  attribution: AttributionReport | null;
}

const WIDGET_CATALOG: Array<{ type: WidgetType; label: string; description: string }> = [
  { type: "customer_stats", label: "Customer Stats", description: "Total / active / lapsed customers, avg lifetime spend" },
  { type: "repeat_trend", label: "Repeat-Purchase Trend", description: "Monthly line chart of customers who came back" },
  { type: "segment_sizes", label: "Segment Sizes", description: "How many customers are in each segment" },
  { type: "top_customers", label: "Top Customers", description: "Your best customers by lifetime spend" },
  { type: "campaign_ab_compare", label: "Campaign A/B Compare", description: "Messaged vs. hold-out control for one sent campaign" },
  { type: "campaign_impact", label: "Campaign Impact", description: "Sent campaigns, incremental revenue, and redemptions overall" },
];

const WIDGET_LABEL: Record<WidgetType, string> = Object.fromEntries(
  WIDGET_CATALOG.map((w) => [w.type, w.label])
) as Record<WidgetType, string>;

function newWidgetId(): string {
  return `widget-${Math.random().toString(36).slice(2, 10)}`;
}

export default function PersonalizationDashboardPage() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[] | null>(null);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const primary = getSession()?.tenant.config.branding.colors.primary ?? "#8b4513";

  useEffect(() => {
    api<{ dashboard: DashboardConfig }>("/settings/personalization-dashboard")
      .then((r) => setConfig(r.dashboard))
      .catch((e) => setError(String(e.message ?? e)));
    api<Insights>("/insights").then(setInsights).catch(() => {});
    api<{ campaigns: CampaignItem[] }>("/campaigns")
      .then((r) => setCampaigns(r.campaigns))
      .catch(() => setCampaigns([]));
  }, []);

  async function saveConfig(next: DashboardConfig) {
    setConfig(next);
    try {
      await api("/settings/personalization-dashboard", { method: "PUT", body: JSON.stringify({ dashboard: next }) });
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

  function setWidgetCampaign(id: string, campaignId: string) {
    if (!config) return;
    saveConfig({
      widgets: config.widgets.map((w) => (w.id === id ? { ...w, config: { ...w.config, campaignId } } : w)),
    });
  }

  const sentCampaigns = (campaigns ?? []).filter((c) => c.status === "sent" && c.attribution);

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

    if (widget.type === "customer_stats") {
      if (!insights) return null;
      return (
        <div className="card" key={widget.id}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>{title}</div>
            {controls}
          </div>
          <div className="grid grid-4" style={{ marginBottom: 0 }}>
            <div>
              <div className="stat-label">Customers</div>
              <div className="stat-value">{insights.customers.total}</div>
            </div>
            <div>
              <div className="stat-label">Active</div>
              <div className="stat-value good-text">{insights.customers.active}</div>
            </div>
            <div>
              <div className="stat-label">Drifting away</div>
              <div className="stat-value">{insights.customers.lapsed}</div>
            </div>
            <div>
              <div className="stat-label">Avg. lifetime spend</div>
              <div className="stat-value">₹{Math.round(insights.customers.avgLtv).toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      );
    }

    if (widget.type === "repeat_trend") {
      if (!insights) return null;
      return (
        <div className="card" key={widget.id}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>{title}</div>
            {controls}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={insights.repeatTrend} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8a8178" }} tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                tick={{ fontSize: 12, fill: "#8a8178" }}
                tickLine={false}
                axisLine={false}
                domain={[0, 1]}
              />
              <Tooltip
                formatter={(v) => [`${Math.round(Number(v) * 100)}%`, "came back same month"]}
                contentStyle={{ borderRadius: 10, border: "1px solid #eee5da", fontSize: 13 }}
              />
              <Line
                type="monotone"
                dataKey="repeatRate"
                stroke={primary}
                strokeWidth={2}
                dot={{ r: 3, fill: primary, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (widget.type === "segment_sizes") {
      if (!insights) return null;
      return (
        <div className="card" key={widget.id}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>{title}</div>
            {controls}
          </div>
          {insights.segments.length === 0 ? (
            <div className="muted">No segments yet.</div>
          ) : (
            <div className="grid grid-4" style={{ marginBottom: 0 }}>
              {insights.segments.map((s) => (
                <div key={s.id}>
                  <div className="stat-label">{s.name}</div>
                  <div className="stat-value">{s.size}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (widget.type === "top_customers") {
      if (!insights) return null;
      return (
        <div className="card" key={widget.id}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>{title}</div>
            {controls}
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Favorite</th>
                <th className="num">Spent</th>
                <th className="num">Last visit</th>
              </tr>
            </thead>
            <tbody>
              {insights.topCustomers.slice(0, 8).map((c) => (
                <tr key={c.phone}>
                  <td>{c.name}</td>
                  <td className="muted">{c.favoriteItem ?? "—"}</td>
                  <td className="num">₹{Math.round(c.ltv).toLocaleString("en-IN")}</td>
                  <td className="num muted">{c.recencyDays}d ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (widget.type === "campaign_ab_compare") {
      const campaignId =
        widget.config?.campaignId ||
        [...sentCampaigns].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.id ||
        "";
      const campaign = sentCampaigns.find((c) => c.id === campaignId);
      const report = campaign?.attribution ?? null;

      return (
        <div className="card" key={widget.id}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
            <div className="section-title" style={{ marginBottom: 0 }}>{title}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={campaignId}
                onChange={(e) => setWidgetCampaign(widget.id, e.target.value)}
                style={{ maxWidth: 220 }}
              >
                {sentCampaigns.length === 0 && <option value="">No sent campaigns yet</option>}
                {sentCampaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.segmentName} — {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </option>
                ))}
              </select>
              {controls}
            </div>
          </div>
          {!report ? (
            <div className="muted">No sent campaign with results yet.</div>
          ) : (
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div className="stat-label">A · Messaged</div>
                <div className="stat-value good-text">{Math.round(report.messagedRepeatRate * 100)}%</div>
                <div className="stat-hint">{report.messagedCount} customers</div>
                <div className="muted" style={{ fontSize: "0.85rem", marginTop: 6 }}>
                  ₹{Math.round(report.messagedRevenuePerCustomer)}/customer · {report.redemptions} redeemed
                </div>
              </div>
              <div style={{ flex: 1, textAlign: "center", borderLeft: "1px solid var(--line)" }}>
                <div className="stat-label">B · Control</div>
                <div className="stat-value">{Math.round(report.controlRepeatRate * 100)}%</div>
                <div className="stat-hint">{report.controlCount} customers</div>
                <div className="muted" style={{ fontSize: "0.85rem", marginTop: 6 }}>
                  ₹{Math.round(report.controlRevenuePerCustomer)}/customer
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (widget.type === "campaign_impact") {
      if (!insights) return null;
      return (
        <div className="card" key={widget.id}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>{title}</div>
            {controls}
          </div>
          <div className="grid grid-4" style={{ marginBottom: 0 }}>
            <div>
              <div className="stat-label">Campaigns sent</div>
              <div className="stat-value">{insights.impact.sentCampaigns}</div>
            </div>
            <div>
              <div className="stat-label">Incremental revenue</div>
              <div className="stat-value good-text">₹{insights.impact.incrementalRevenue.toLocaleString("en-IN")}</div>
            </div>
            <div>
              <div className="stat-label">Redemptions</div>
              <div className="stat-value">{insights.impact.redemptions}</div>
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
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Pick your own widgets — comparisons, graphs, and stats, built from your data.</div>
        </div>
        <div style={{ position: "relative" }}>
          <button className="btn btn-primary" onClick={() => setPickerOpen((o) => !o)}>
            + Widget
          </button>
          {pickerOpen && (
            <div
              className="card"
              style={{ position: "absolute", right: 0, top: 44, zIndex: 10, width: 280, padding: 10 }}
            >
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

      {!config || !insights ? (
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
