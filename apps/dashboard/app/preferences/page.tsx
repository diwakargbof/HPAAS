"use client";

// Per-campaign-type toggles + weekly frequency cap, in plain English.
// Reads/writes the preferences table; the suppression layer enforces it.

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "../../lib/api";

interface Pref {
  campaignType: string;
  enabled: boolean;
  maxPerCustomerPerWeek: number;
}

const PREF_META: Record<string, { label: string; hint: string }> = {
  winback: {
    label: "Win-back messages",
    hint: "A friendly nudge to customers who haven't visited in a couple of months.",
  },
  festival_preorder: {
    label: "Festival pre-orders",
    hint: "Invite festival shoppers to pre-order before the rush, a few days ahead.",
  },
  new_item_alert: {
    label: "New item alerts",
    hint: "Tell customers about fresh items in the categories they already buy.",
  },
  reorder_reminder: {
    label: "Reorder reminders",
    hint: "A reminder when a regular is due to restock their usual order.",
  },
};

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<Pref[] | null>(null);
  const [cap, setCap] = useState(1);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ preferences: Pref[] }>("/preferences")
      .then((r) => {
        setPrefs(r.preferences);
        setCap(Math.max(...r.preferences.map((p) => p.maxPerCustomerPerWeek), 1));
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  async function save(next: Pref[], nextCap: number) {
    setSaved(false);
    setError("");
    try {
      const body = next.map((p) => ({ ...p, maxPerCustomerPerWeek: nextCap }));
      const r = await api<{ preferences: Pref[] }>("/preferences", {
        method: "PUT",
        body: JSON.stringify({ preferences: body }),
      });
      setPrefs(r.preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <AppShell>
      <div className="page-title">Preferences</div>
      <div className="page-sub">Choose what kinds of messages your customers can receive.</div>
      {error && <div className="error-text">{error}</div>}
      {!prefs ? (
        <div className="muted">Loading…</div>
      ) : (
        <>
          <div className="grid grid-2">
            {prefs.map((p, i) => {
              const meta = PREF_META[p.campaignType] ?? { label: p.campaignType, hint: "" };
              return (
                <div className="card" key={p.campaignType} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => {
                        const next = prefs.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x));
                        setPrefs(next);
                        save(next, cap);
                      }}
                    />
                    <span className="slider" />
                  </label>
                  <div>
                    <div style={{ fontWeight: 650 }}>{meta.label}</div>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {meta.hint}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ maxWidth: 520 }}>
            <div className="section-title">Don&apos;t overdo it</div>
            <div className="muted" style={{ marginBottom: 10 }}>
              Maximum messages any one customer can get per week, across all campaign types.
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="number"
                min={1}
                max={7}
                value={cap}
                style={{ width: 90 }}
                onChange={(e) => setCap(Math.max(1, Math.min(7, Number(e.target.value) || 1)))}
              />
              <span className="muted">per week</span>
              <button className="btn btn-primary" onClick={() => save(prefs, cap)}>
                Save
              </button>
              {saved && <span className="good-text">Saved ✓</span>}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
