"use client";

// AI-assist: a per-tenant, off-by-default opt-in to use a real AI model for
// campaign copy/segments/counter-pitch (Personalization) and pricing/inventory
// rationale (Pricing). Off = the exact same deterministic writer every
// surface already uses with no key configured — nothing breaks either way.
// Lives on the tenant-wide Settings hub since it covers both areas. The key
// itself is never round-tripped back from the server, only a masked
// hasApiKey boolean — see GET/PUT /settings/ai-assist.

import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface AiAssistState {
  personalization: boolean;
  pricing: boolean;
}

interface AiAssistResponse {
  aiAssist: AiAssistState;
  hasApiKey: boolean;
  provider: string;
  model?: string;
}

export default function AiAssistCard() {
  const [state, setState] = useState<AiAssistResponse | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [providerInput, setProviderInput] = useState("anthropic");
  const [modelInput, setModelInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<AiAssistResponse>("/settings/ai-assist")
      .then((r) => {
        setState(r);
        setProviderInput(r.provider);
        setModelInput(r.model ?? "");
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  async function save(patch: Partial<AiAssistState> & { apiKeyChanged?: boolean }) {
    if (!state) return;
    const next = { ...state.aiAssist, ...patch };
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        personalization: next.personalization,
        pricing: next.pricing,
        provider: providerInput.trim() || "anthropic",
        model: modelInput.trim(),
      };
      if (patch.apiKeyChanged) body.apiKey = apiKeyInput.trim();
      await api("/settings/ai-assist", { method: "PUT", body: JSON.stringify(body) });
      setState({ ...state, aiAssist: next, provider: providerInput.trim() || "anthropic", hasApiKey: patch.apiKeyChanged ? Boolean(apiKeyInput.trim()) : state.hasApiKey });
      if (patch.apiKeyChanged) setApiKeyInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!state) {
    return (
      <div className="card">
        <div className="section-title">AI Assist</div>
        {error ? <div className="error-text">{error}</div> : <div className="muted">Loading…</div>}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="section-title">AI Assist{saving ? " · saving…" : ""}</div>
      <div className="muted" style={{ marginBottom: 14, fontSize: "0.9rem" }}>
        Off by default. When off, campaign copy, segment authoring/discovery, counter-pitch, and
        pricing/inventory rationale all use the same built-in deterministic writer — nothing
        breaks, it's just less flavorful. When on, those surfaces call a real AI model using the
        key below. This may become a paid add-on as usage grows.
      </div>
      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
        <label className="toggle">
          <input
            type="checkbox"
            checked={state.aiAssist.personalization}
            onChange={(e) => save({ personalization: e.target.checked })}
          />
          <span className="slider" />
        </label>
        <span>Use AI for Personalization (copy, segments, counter-pitch)</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <label className="toggle">
          <input
            type="checkbox"
            checked={state.aiAssist.pricing}
            onChange={(e) => save({ pricing: e.target.checked })}
          />
          <span className="slider" />
        </label>
        <span>Use AI for Pricing &amp; Inventory rationale</span>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
        <div>
          <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 4 }}>
            Model provider
          </div>
          <input
            value={providerInput}
            onChange={(e) => setProviderInput(e.target.value)}
            placeholder="anthropic"
            style={{ width: 160 }}
          />
        </div>
        <div>
          <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 4 }}>
            Model (optional override)
          </div>
          <input
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            placeholder="provider default"
            style={{ width: 220 }}
          />
        </div>
      </div>

      <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 6 }}>
        API key {state.hasApiKey ? "(a key is already saved — leave blank to keep it)" : "(none saved yet)"}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder={state.hasApiKey ? "•••• (unchanged)" : "paste your provider API key"}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button className="btn btn-primary" disabled={!apiKeyInput.trim()} onClick={() => save({ apiKeyChanged: true })}>
          Save key
        </button>
        {state.hasApiKey && (
          <button
            className="btn"
            onClick={() => {
              setApiKeyInput("");
              save({ apiKeyChanged: true });
            }}
          >
            Clear key
          </button>
        )}
      </div>
    </div>
  );
}
