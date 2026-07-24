"use client";

// Channels: per-tenant WhatsApp Business + email sending credentials. Each
// shop has its own WhatsApp number and, optionally, its own email sender —
// these used to be single platform-wide env vars, now they're per-tenant,
// stored in the same tenant_secrets table as the AI Assist key. A saved
// value here always overrides the platform's env var of the same name;
// leaving everything blank falls back to that env var exactly as before
// this existed. Nothing here is ever echoed back raw — only masked
// booleans (hasWhatsappAccessToken, etc) — see GET/PUT /settings/channels.

import { useEffect, useState } from "react";
import { api, getSession } from "../lib/api";

interface ChannelsInfo {
  whatsappMode: "stub" | "live";
  hasWhatsappAccessToken: boolean;
  whatsappPhoneNumberId: string | null;
  hasWhatsappWebhookVerifyToken: boolean;
  emailMode: "stub" | "resend";
  hasResendApiKey: boolean;
}

export default function ChannelsCard() {
  const [info, setInfo] = useState<ChannelsInfo | null>(null);
  const [phoneNumberIdInput, setPhoneNumberIdInput] = useState("");
  const [accessTokenInput, setAccessTokenInput] = useState("");
  const [verifyTokenInput, setVerifyTokenInput] = useState("");
  const [resendKeyInput, setResendKeyInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const slug = getSession()?.tenant.config.slug ?? "";
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  function load() {
    api<ChannelsInfo>("/settings/channels")
      .then((r) => {
        setInfo(r);
        setPhoneNumberIdInput(r.whatsappPhoneNumberId ?? "");
      })
      .catch((e) => setError(String(e.message ?? e)));
  }

  useEffect(load, []);

  async function save(body: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      await api("/settings/channels", { method: "PUT", body: JSON.stringify(body) });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!info) {
    return (
      <div className="card">
        <div className="section-title">Channels</div>
        {error ? <div className="error-text">{error}</div> : <div className="muted">Loading…</div>}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="section-title">Channels{saving ? " · saving…" : ""}</div>
      <div className="muted" style={{ marginBottom: 14, fontSize: "0.9rem" }}>
        Your own WhatsApp Business number and email sender. Leave everything blank to keep using
        the platform's shared demo/stub configuration — nothing here is required to explore the
        dashboard.
      </div>
      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="section-title" style={{ fontSize: "0.95rem", marginTop: 4 }}>WhatsApp</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
        <label className="toggle">
          <input
            type="checkbox"
            checked={info.whatsappMode === "live"}
            onChange={(e) => save({ whatsappMode: e.target.checked ? "live" : "stub" })}
          />
          <span className="slider" />
        </label>
        <span>Send real WhatsApp messages (live mode)</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <div>
          <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Phone number ID</div>
          <input
            value={phoneNumberIdInput}
            onChange={(e) => setPhoneNumberIdInput(e.target.value)}
            onBlur={() => save({ whatsappPhoneNumberId: phoneNumberIdInput })}
            placeholder="Meta WABA phone number id"
            style={{ width: 240 }}
          />
        </div>
      </div>

      <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 6 }}>
        Access token {info.hasWhatsappAccessToken ? "(saved — leave blank to keep it)" : "(none saved yet)"}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <input
          type="password"
          value={accessTokenInput}
          onChange={(e) => setAccessTokenInput(e.target.value)}
          placeholder={info.hasWhatsappAccessToken ? "•••• (unchanged)" : "paste Meta access token"}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button
          className="btn btn-primary"
          disabled={!accessTokenInput.trim()}
          onClick={() => {
            save({ whatsappAccessToken: accessTokenInput.trim() });
            setAccessTokenInput("");
          }}
        >
          Save token
        </button>
        {info.hasWhatsappAccessToken && (
          <button className="btn" onClick={() => save({ whatsappAccessToken: "" })}>
            Clear token
          </button>
        )}
      </div>

      <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 6 }}>
        Webhook verify token {info.hasWhatsappWebhookVerifyToken ? "(saved — leave blank to keep it)" : "(using the platform default)"}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <input
          type="password"
          value={verifyTokenInput}
          onChange={(e) => setVerifyTokenInput(e.target.value)}
          placeholder={info.hasWhatsappWebhookVerifyToken ? "•••• (unchanged)" : "set your own verify token"}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button
          className="btn btn-primary"
          disabled={!verifyTokenInput.trim()}
          onClick={() => {
            save({ whatsappWebhookVerifyToken: verifyTokenInput.trim() });
            setVerifyTokenInput("");
          }}
        >
          Save token
        </button>
        {info.hasWhatsappWebhookVerifyToken && (
          <button className="btn" onClick={() => save({ whatsappWebhookVerifyToken: "" })}>
            Clear token
          </button>
        )}
      </div>
      <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 18 }}>
        Your webhook URL (register in the Meta app dashboard):{" "}
        <code style={{ overflowWrap: "anywhere" }}>{apiBase}/webhooks/whatsapp/{slug}</code>
      </div>

      <div className="section-title" style={{ fontSize: "0.95rem" }}>Email</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
        <label className="toggle">
          <input
            type="checkbox"
            checked={info.emailMode === "resend"}
            onChange={(e) => save({ emailMode: e.target.checked ? "resend" : "stub" })}
          />
          <span className="slider" />
        </label>
        <span>Send real emails via Resend</span>
      </div>
      <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 6 }}>
        Resend API key {info.hasResendApiKey ? "(saved — leave blank to keep it)" : "(none saved yet)"}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="password"
          value={resendKeyInput}
          onChange={(e) => setResendKeyInput(e.target.value)}
          placeholder={info.hasResendApiKey ? "•••• (unchanged)" : "paste your Resend API key"}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button
          className="btn btn-primary"
          disabled={!resendKeyInput.trim()}
          onClick={() => {
            save({ resendApiKey: resendKeyInput.trim() });
            setResendKeyInput("");
          }}
        >
          Save key
        </button>
        {info.hasResendApiKey && (
          <button className="btn" onClick={() => save({ resendApiKey: "" })}>
            Clear key
          </button>
        )}
      </div>
    </div>
  );
}
