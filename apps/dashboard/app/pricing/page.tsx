"use client";

// Pricing > Recommendations — tenant-triggered refresh of bounded,
// explainable price suggestions (see /pricing/settings for which items and
// what bounds). Nothing changes a price automatically.

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "../../lib/api";
import { useBusinessUnits } from "../../lib/businessUnits";
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
  needsReview: boolean;
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
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");
  const { units: businessUnits, active: businessUnitsActive } = useBusinessUnits();
  const [businessUnitId, setBusinessUnitId] = useState("");
  const [businessUnitsInPricing, setBusinessUnitsInPricing] = useState(false);
  const showBranchSelector = businessUnitsActive && businessUnitsInPricing;

  useEffect(() => {
    api<{ pricing: { useBusinessUnitsInPricing?: boolean } }>("/settings/pricing")
      .then((r) => setBusinessUnitsInPricing(Boolean(r.pricing.useBusinessUnitsInPricing)))
      .catch(() => setBusinessUnitsInPricing(false));
  }, []);

  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessUnitId]);

  function loadRecommendations() {
    const params = new URLSearchParams();
    if (businessUnitId) params.set("businessUnitId", businessUnitId);
    api<{ recommendations: Recommendation[] }>(`/pricing/recommendations${params.toString() ? `?${params.toString()}` : ""}`)
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
      const r = await api<{ recommendations: Recommendation[] }>("/pricing/refresh", {
        method: "POST",
        body: JSON.stringify(businessUnitId ? { businessUnitId } : {}),
      });
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
    setNotice("");
    try {
      const result = await api<{ applied: number; skippedNeedsReview: number }>("/pricing/apply", {
        method: "POST",
        body: JSON.stringify(
          menuItemId
            ? { menuItemId, confirmReview: Boolean(reviewed[menuItemId]), businessUnitId: businessUnitId || undefined }
            : { all: true, businessUnitId: businessUnitId || undefined }
        ),
      });
      if (!menuItemId && result.skippedNeedsReview > 0) {
        setNotice(
          `Applied ${result.applied}. ${result.skippedNeedsReview} need${result.skippedNeedsReview === 1 ? "s" : ""} review — apply ${result.skippedNeedsReview === 1 ? "it" : "them"} individually.`
        );
      }
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
        {showBranchSelector && (
          <>
            {" "}Optimizing for <strong>{businessUnitId ? businessUnits.find((u) => u.id === businessUnitId)?.name : "all branches"}</strong> —
            a branch-scoped refresh only uses that branch's own sales and applying only changes that branch's price.
          </>
        )}
      </div>
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Recommendations</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {showBranchSelector && (
              <select value={businessUnitId} onChange={(e) => setBusinessUnitId(e.target.value)} style={{ width: 180 }}>
                <option value="">All branches</option>
                {businessUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r) => (
                <tr key={r.menuItemId}>
                  <td>
                    {r.name}
                    {r.needsReview && (
                      <div>
                        <span className="badge badge-pending" style={{ marginTop: 4 }}>Needs review</span>
                      </div>
                    )}
                  </td>
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
                    {r.needsReview && (
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem" }}>
                        <input
                          type="checkbox"
                          checked={Boolean(reviewed[r.menuItemId])}
                          onChange={(e) => setReviewed((prev) => ({ ...prev, [r.menuItemId]: e.target.checked }))}
                        />
                        Reviewed
                      </label>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      disabled={
                        applying !== null ||
                        r.suggestedPrice === r.currentPrice ||
                        (r.needsReview && !reviewed[r.menuItemId])
                      }
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
