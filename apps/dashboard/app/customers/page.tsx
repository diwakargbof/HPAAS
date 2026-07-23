"use client";

// All Customers — the full list (not just the top 8 shown on My Customers),
// searchable by name/phone and sortable by recency, lifetime spend, 90-day
// purchase frequency, or name.

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api, getSession } from "../../lib/api";
import { useBusinessUnits } from "../../lib/businessUnits";

interface Customer {
  id: string;
  name: string;
  phone: string;
  ltv: number | null;
  purchases90d: number | null;
  recencyDays: number | null;
  favoriteItem: string | null;
  joinedAt: string;
}

const SORTS = [
  { value: "recent", label: "Most recent" },
  { value: "ltv", label: "Top spenders" },
  { value: "purchases", label: "Most purchases" },
  { value: "alphabetical", label: "Alphabetical" },
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("recent");
  const { units: businessUnits, active: businessUnitsActive } = useBusinessUnits();
  const [businessUnitId, setBusinessUnitId] = useState("");
  const primary = getSession()?.tenant.config.branding.colors.primary ?? "#8b4513";

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams({ sort });
      if (search.trim()) params.set("search", search.trim());
      if (businessUnitId) params.set("businessUnitId", businessUnitId);
      api<{ customers: Customer[] }>(`/customers?${params.toString()}`)
        .then((r) => setCustomers(r.customers))
        .catch((e) => setError(String(e.message ?? e)));
    }, 250);
    return () => clearTimeout(handle);
  }, [search, sort, businessUnitId]);

  return (
    <AppShell>
      <div className="page-title">All Customers</div>
      <div className="page-sub">Every customer who has bought from you — searchable and sortable.</div>
      {error && <div className="error-text">{error}</div>}

      <div className="card">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            style={{ maxWidth: 260 }}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} style={{ width: 180 }}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          {businessUnitsActive && (
            <select value={businessUnitId} onChange={(e) => setBusinessUnitId(e.target.value)} style={{ width: 180 }}>
              <option value="">All branches</option>
              {businessUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
          {customers && (
            <span className="muted" style={{ marginLeft: "auto", fontSize: "0.9rem" }}>
              {customers.length} customer{customers.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {!customers ? (
          <div className="muted">Loading…</div>
        ) : customers.length === 0 ? (
          <div className="muted">No customers match that search.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Favorite item</th>
                <th className="num">Lifetime spend</th>
                <th className="num">Orders (90d)</th>
                <th className="num">Last visit</th>
                <th className="num">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: primary,
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {initials(c.name)}
                      </span>
                      <div>
                        <div>{c.name}</div>
                        <div className="muted" style={{ fontSize: "0.8rem" }}>{c.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="muted">{c.favoriteItem ?? "—"}</td>
                  <td className="num">{c.ltv !== null ? `₹${Math.round(c.ltv).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="num">{c.purchases90d ?? "—"}</td>
                  <td className="num muted">{c.recencyDays !== null ? `${c.recencyDays}d ago` : "—"}</td>
                  <td className="num muted">{new Date(c.joinedAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
