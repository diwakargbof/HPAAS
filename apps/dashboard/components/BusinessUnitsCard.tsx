"use client";

// Business Units (branches/regions) — a tag/filter dimension shared by
// Personalization and Pricing. Managed from either area's Settings page;
// both hit the same GET/PUT /settings/business-units so either place
// stays in sync. The master toggle lets a tenant configure branches and
// still keep the whole feature switched off everywhere (Customers,
// Billing, Menu, Pricing Recommendations all gate on it via
// lib/businessUnits.ts's `active` flag).

import { useEffect, useState } from "react";
import { api } from "../lib/api";

export interface BusinessUnit {
  id: string;
  name: string;
}

export default function BusinessUnitsCard() {
  const [units, setUnits] = useState<BusinessUnit[] | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api<{ enabled: boolean; units: BusinessUnit[] }>("/settings/business-units")
      .then((r) => {
        setUnits(r.units);
        setEnabled(r.enabled);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  async function save(nextEnabled: boolean, nextUnits: BusinessUnit[]) {
    setBusy("save");
    setError("");
    try {
      const r = await api<{ enabled: boolean; units: BusinessUnit[] }>("/settings/business-units", {
        method: "PUT",
        body: JSON.stringify({ enabled: nextEnabled, units: nextUnits }),
      });
      setUnits(r.units);
      setEnabled(r.enabled);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  function toggleEnabled() {
    if (!units) return;
    save(!enabled, units);
  }

  function add() {
    if (!newName.trim() || !units) return;
    save(enabled, [...units, { id: `bu-${Math.random().toString(36).slice(2, 10)}`, name: newName.trim() }]);
    setNewName("");
  }

  function rename(id: string, name: string) {
    if (!units) return;
    setUnits(units.map((u) => (u.id === id ? { ...u, name } : u)));
  }

  function commitRename(id: string) {
    if (!units) return;
    save(enabled, units);
  }

  function remove(id: string) {
    if (!units) return;
    save(enabled, units.filter((u) => u.id !== id));
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Business Units</div>
        <label className="toggle">
          <input type="checkbox" checked={enabled} disabled={!units || busy === "save"} onChange={toggleEnabled} />
          <span className="slider" />
        </label>
      </div>
      <div className="muted" style={{ marginBottom: 14 }}>
        Branches, counters, or regions — tag customers and menu items with one, then filter by it. Off by
        default: switch this on to use it anywhere in the app, and off again any time without losing your list.
      </div>
      {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}

      {!units ? (
        <div className="muted">Loading…</div>
      ) : (
        <div style={{ opacity: enabled ? 1 : 0.5 }}>
          {units.length === 0 ? (
            <div className="muted" style={{ marginBottom: 14 }}>No business units yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {units.map((u) => (
                <div key={u.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    value={u.name}
                    onChange={(e) => rename(u.id, e.target.value)}
                    onBlur={() => commitRename(u.id)}
                    style={{ maxWidth: 220 }}
                  />
                  <button
                    className="btn btn-danger"
                    style={{ padding: "4px 10px", fontSize: "0.82rem" }}
                    disabled={busy === "save"}
                    onClick={() => remove(u.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New business unit name"
              style={{ maxWidth: 220 }}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <button className="btn btn-primary" disabled={busy === "save" || !newName.trim()} onClick={add}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
