"use client";

// Pricing > Recommendations — tenant-triggered refresh of bounded,
// explainable price suggestions (see /pricing/settings for which items and
// what bounds). Nothing changes a price automatically.

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "../../lib/api";
import PricingLocked from "./locked";

interface Recommendation {
  menuItemId: string;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  changePercent: number;
  demandTrend: "rising" | "falling" | "flat";
  confidence: "low" | "medium" | "high";
  rationale: string | null;
}

const TREND_ARROW: Record<Recommendation["demandTrend"], string> = {
  rising: "▲",
  falling: "▼",
  flat: "—",
};

const CONFIDENCE_BADGE: Record<Recommendation["confidence"], string> = {
  high: "badge-sent",
  medium: "badge-pending",
  low: "badge-rejected",
};

export default function PricingRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  function loadRecommendations() {
    api<{ recommendations: Recommendation[] }>("/pricing/recommendations")
      .then((r) => setRecommendations(r.recommendations))
      .catch((e: Error & { status?: number }) => {
        if (e.status === 403) setLocked(true);
        else setRecommendations([]);
      });
  }

  async function refresh() {
    setRefreshing(true);
    setError("");
    try {
      const r = await api<{ recommendations: Recommendation[] }>("/pricing/refresh", { method: "POST" });
      setRecommendations(r.recommendations);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  }

  async function apply(menuItemId?: string) {
    setApplying(menuItemId ?? "all");
    setError("");
    try {
      await api("/pricing/apply", {
        method: "POST",
        body: JSON.stringify(menuItemId ? { menuItemId } : { all: true }),
      });
      loadRecommendations();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setApplying(null);
    }
  }

  if (locked) {
    return (
      <AppShell>
        <PricingLocked />
      </AppShell>
    );
  }

  if (!recommendations) {
    return (
      <AppShell>
        <div className="page-title">Pricing Recommendations</div>
        {error ? <div className="error-text">{error}</div> : <div className="muted">Loading…</div>}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-title">Pricing Recommendations</div>
      <div className="page-sub">
        Bounded, explainable price suggestions from your own sales history — nothing changes until you apply it.
        Pick which items to optimize and set bounds under <a href="/pricing/settings">Item Settings</a>.
      </div>
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Recommendations</div>
          <div style={{ display: "flex", gap: 10 }}>
            {recommendations.length > 0 && (
              <button className="btn btn-ghost" disabled={applying !== null} onClick={() => apply()}>
                {applying === "all" ? "Applying…" : "Apply all"}
              </button>
            )}
            <button className="btn btn-primary" disabled={refreshing} onClick={refresh}>
              {refreshing ? "Refreshing…" : "Refresh recommendations"}
            </button>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="muted">
            No recommendations yet — enable at least one item under <a href="/pricing/settings">Item Settings</a>,
            then hit Refresh.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Current</th>
                <th className="num">Suggested</th>
                <th className="num">Change</th>
                <th>Confidence</th>
                <th>Why</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r) => (
                <tr key={r.menuItemId}>
                  <td>{r.name}</td>
                  <td className="num">₹{r.currentPrice.toFixed(2)}</td>
                  <td className="num">₹{r.suggestedPrice.toFixed(2)}</td>
                  <td className="num">
                    {TREND_ARROW[r.demandTrend]} {r.changePercent > 0 ? "+" : ""}
                    {r.changePercent.toFixed(1)}%
                  </td>
                  <td>
                    <span className={`badge ${CONFIDENCE_BADGE[r.confidence]}`}>{r.confidence}</span>
                  </td>
                  <td className="muted" style={{ maxWidth: 260 }}>{r.rationale}</td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      disabled={applying !== null || r.suggestedPrice === r.currentPrice}
                      onClick={() => apply(r.menuItemId)}
                    >
                      {applying === r.menuItemId ? "Applying…" : "Apply"}
                    </button>
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
