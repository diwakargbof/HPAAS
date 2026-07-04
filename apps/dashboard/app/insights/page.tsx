"use client";

// Plain-language customer picture. Big legible numbers, no marketing jargon.

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
import AppShell from "../../components/AppShell";
import { api, getSession } from "../../lib/api";

interface Insights {
  customers: { total: number; active: number; lapsed: number; avgLtv: number };
  segments: Array<{ id: string; name: string; campaignType: string; size: number }>;
  topCustomers: Array<{
    name: string;
    phone: string;
    ltv: number;
    recencyDays: number;
    favoriteItem: string | null;
  }>;
  repeatTrend: Array<{ month: string; buyers: number; repeatRate: number }>;
  impact: { sentCampaigns: number; incrementalRevenue: number; redemptions: number };
}

const SEGMENT_HINT: Record<string, string> = {
  winback: "Haven't visited in a while — worth a gentle nudge",
  festival_preorder: "Bought from you before festivals",
  new_item_alert: "Love a category — tell them about new items",
  reorder_reminder: "Usually restock around now",
};

export default function InsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState("");
  const primary = getSession()?.tenant.config.branding.colors.primary ?? "#8b4513";

  useEffect(() => {
    api<Insights>("/insights").then(setData).catch((e) => setError(String(e.message ?? e)));
  }, []);

  return (
    <AppShell>
      <div className="page-title">My Customers</div>
      <div className="page-sub">How your shop&apos;s customers are doing, in plain numbers.</div>
      {error && <div className="error-text">{error}</div>}
      {!data ? (
        <div className="muted">Loading…</div>
      ) : (
        <>
          <div className="grid grid-4">
            <div className="card">
              <div className="stat-label">Customers</div>
              <div className="stat-value">{data.customers.total}</div>
              <div className="stat-hint">people who bought from you</div>
            </div>
            <div className="card">
              <div className="stat-label">Active</div>
              <div className="stat-value good-text">{data.customers.active}</div>
              <div className="stat-hint">visited in the last 2 months</div>
            </div>
            <div className="card">
              <div className="stat-label">Drifting away</div>
              <div className="stat-value">{data.customers.lapsed}</div>
              <div className="stat-hint">no visit for 2+ months</div>
            </div>
            <div className="card">
              <div className="stat-label">Avg. lifetime spend</div>
              <div className="stat-value">₹{Math.round(data.customers.avgLtv).toLocaleString("en-IN")}</div>
              <div className="stat-hint">per customer, all time</div>
            </div>
          </div>

          {data.impact.sentCampaigns > 0 && (
            <div className="grid grid-4">
              <div className="card">
                <div className="stat-label">Campaigns sent</div>
                <div className="stat-value">{data.impact.sentCampaigns}</div>
              </div>
              <div className="card">
                <div className="stat-label">Extra revenue vs. no message</div>
                <div className="stat-value good-text">
                  ₹{data.impact.incrementalRevenue.toLocaleString("en-IN")}
                </div>
                <div className="stat-hint">compared with the hold-out group</div>
              </div>
              <div className="card">
                <div className="stat-label">Codes redeemed</div>
                <div className="stat-value">{data.impact.redemptions}</div>
                <div className="stat-hint">customers who came back with a code</div>
              </div>
            </div>
          )}

          <div className="grid grid-4">
            {data.segments.map((s) => (
              <div className="card" key={s.id}>
                <div className="stat-label">{s.name}</div>
                <div className="stat-value">{s.size}</div>
                <div className="stat-hint">{SEGMENT_HINT[s.campaignType] ?? ""}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-2">
            <div className="card">
              <div className="section-title">Customers who came back (monthly)</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.repeatTrend} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
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

            <div className="card">
              <div className="section-title">Your best customers</div>
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
                  {data.topCustomers.slice(0, 8).map((c) => (
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
          </div>
        </>
      )}
    </AppShell>
  );
}
