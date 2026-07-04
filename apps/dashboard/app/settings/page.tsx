"use client";

// WhatsApp connection status, branding preview from tenant config, basic
// account info (API key for POS integration).

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "../../lib/api";

interface Settings {
  shopName: string;
  branding: {
    shopName: string;
    colors: { primary: string; accent: string; background: string };
  };
  whatsapp: { number: string; mode: string; connected: boolean };
  email: { enabled: boolean; fromAddress: string };
  apiKey: string;
  festivals: Array<{ name: string; date: string; preWindowDays: number }>;
}

export default function SettingsPage() {
  const [data, setData] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    api<Settings>("/settings").then(setData).catch((e) => setError(String(e.message ?? e)));
  }, []);

  return (
    <AppShell>
      <div className="page-title">Settings</div>
      <div className="page-sub">Your shop&apos;s connections and branding.</div>
      {error && <div className="error-text">{error}</div>}
      {!data ? (
        <div className="muted">Loading…</div>
      ) : (
        <div className="grid grid-2">
          <div className="card">
            <div className="section-title">WhatsApp</div>
            <table>
              <tbody>
                <tr>
                  <td className="muted">Business number</td>
                  <td>{data.whatsapp.number}</td>
                </tr>
                <tr>
                  <td className="muted">Status</td>
                  <td>
                    {data.whatsapp.connected ? (
                      <span className="badge badge-sent">connected</span>
                    ) : (
                      <span className="badge badge-pending">demo mode</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            {!data.whatsapp.connected && (
              <div className="notice" style={{ marginTop: 12, marginBottom: 0 }}>
                Messages are simulated until the WhatsApp Business connection is approved. Everything
                else works exactly as it will once connected.
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-title">Branding preview</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
              {(["primary", "accent", "background"] as const).map((k) => (
                <div key={k} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 12,
                      background: data.branding.colors[k],
                      border: "1px solid var(--line)",
                    }}
                  />
                  <div className="muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
                    {k}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="msg-preview"
              style={{ background: data.branding.colors.background, borderColor: "var(--line)" }}
            >
              <strong style={{ color: data.branding.colors.primary }}>{data.shopName}</strong> — this is
              how your name and colors appear across the dashboard.
            </div>
          </div>

          <div className="card">
            <div className="section-title">Festival calendar</div>
            <table>
              <thead>
                <tr>
                  <th>Festival</th>
                  <th>Date</th>
                  <th className="num">Campaign window</th>
                </tr>
              </thead>
              <tbody>
                {data.festivals.map((f, i) => (
                  <tr key={i}>
                    <td>{f.name}</td>
                    <td className="muted">{f.date}</td>
                    <td className="num muted">{f.preWindowDays} days before</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="section-title">POS integration</div>
            <div className="muted" style={{ marginBottom: 8 }}>
              Your API key — used by your billing system to send sales and redemptions automatically.
            </div>
            <code
              style={{
                display: "block",
                background: "var(--bg)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: "0.85rem",
                cursor: "pointer",
                overflowWrap: "anywhere",
              }}
              onClick={() => setShowKey(!showKey)}
              title="Click to reveal/hide"
            >
              {showKey ? data.apiKey : "••••••••••••••••••••  (click to reveal)"}
            </code>
            <div className="muted" style={{ marginTop: 8 }}>
              Email fallback: {data.email.enabled ? `on (${data.email.fromAddress})` : "off"}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
