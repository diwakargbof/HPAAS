"use client";

// Segments — describe an audience in your own words, or let the AI study
// your numbers and propose segments. Every proposal shows its live
// audience size before anything is saved; every saved segment can become
// a campaign (which still waits in the approval queue).

import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "../../lib/api";

interface SegmentItem {
  id: string;
  name: string;
  description: string | null;
  campaignType: string;
  source: "standard" | "custom" | "ai_suggested";
  rule: Record<string, unknown>;
  audienceSize: number;
}

interface Proposal {
  name: string;
  description: string;
  campaignType: string;
  rule: Record<string, unknown>;
  audienceSize: number;
}

const TYPE_LABEL: Record<string, string> = {
  winback: "Win-back",
  festival_preorder: "Festival pre-order",
  new_item_alert: "New item alert",
  reorder_reminder: "Reorder reminder",
};

const SOURCE_LABEL: Record<string, string> = {
  standard: "standard",
  custom: "yours",
  ai_suggested: "AI pick",
};

function ruleSummary(rule: Record<string, unknown>): string {
  return Object.entries(rule)
    .map(([col, cond]) => {
      const label = col.replace(/_/g, " ");
      if (typeof cond !== "object" || cond === null) return `${label} = ${cond}`;
      return Object.entries(cond as Record<string, unknown>)
        .map(([op, v]) => `${label} ${op} ${Array.isArray(v) ? v.join("/") : v}`)
        .join(", ");
    })
    .join(" · ");
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<SegmentItem[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [prompt, setPrompt] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  const [discovering, setDiscovering] = useState(false);
  const [suggestions, setSuggestions] = useState<Proposal[] | null>(null);
  const [busy, setBusy] = useState("");
  const [creatorOpen, setCreatorOpen] = useState(false);

  const load = useCallback(() => {
    api<{ segments: SegmentItem[] }>("/segments")
      .then((r) => setSegments(r.segments))
      .catch((e) => setError(String(e.message ?? e)));
  }, []);
  useEffect(load, [load]);

  async function preview() {
    if (!prompt.trim()) return;
    setPreviewing(true);
    setError("");
    setProposal(null);
    try {
      const r = await api<{ proposal: Proposal }>("/segments/preview", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      setProposal(r.proposal);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPreviewing(false);
    }
  }

  async function save(p: Proposal, source: "custom" | "ai_suggested") {
    setBusy(p.name);
    setError("");
    try {
      await api("/segments", {
        method: "POST",
        body: JSON.stringify({ ...p, source }),
      });
      setNotice(`Saved "${p.name}" — it'll be checked by the daily campaign run, or create a campaign now below.`);
      setProposal(null);
      setSuggestions((s) => s?.filter((x) => x.name !== p.name) ?? null);
      if (source === "custom") {
        setPrompt("");
        setCreatorOpen(false);
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function discover() {
    setDiscovering(true);
    setError("");
    try {
      const r = await api<{ proposals: Proposal[] }>("/segments/discover", { method: "POST" });
      setSuggestions(r.proposals);
      if (r.proposals.length === 0) setNotice("No new segment ideas right now — you've covered the interesting ones.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDiscovering(false);
    }
  }

  async function runCampaign(s: SegmentItem) {
    setBusy(s.id);
    setError("");
    setNotice("");
    try {
      const r = await api<{ result: { outcome: string; reason?: string; audienceSize?: number } }>(
        `/segments/${s.id}/run`,
        { method: "POST" }
      );
      setNotice(
        r.result.outcome === "campaign_created"
          ? `Campaign created for "${s.name}" (${r.result.audienceSize} customers) — waiting in your approval queue.`
          : `Nothing created for "${s.name}": ${r.result.reason}.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function remove(s: SegmentItem) {
    setBusy(s.id);
    setError("");
    try {
      await api(`/segments/${s.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  const proposalCard = (p: Proposal, source: "custom" | "ai_suggested") => (
    <div className="card" key={p.name} style={{ marginBottom: 12, borderLeft: "4px solid var(--accent)" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <strong>{p.name}</strong>
        <span className="badge badge-type">{TYPE_LABEL[p.campaignType] ?? p.campaignType}</span>
        <span className="badge badge-sent">{p.audienceSize} customers today</span>
      </div>
      <div className="muted" style={{ margin: "6px 0" }}>{p.description}</div>
      <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 10 }}>Rule: {ruleSummary(p.rule)}</div>
      <button className="btn btn-primary" disabled={busy === p.name} onClick={() => save(p, source)}>
        Save segment
      </button>
    </div>
  );

  return (
    <AppShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div className="page-title">Segments</div>
          <div className="page-sub">
            Who gets which campaign. Describe an audience in your own words, or let AI study your sales and suggest one.
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setCreatorOpen((o) => !o)}>
          {creatorOpen ? "Close" : "+ New Segment"}
        </button>
      </div>
      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {creatorOpen && (
        <div className="grid grid-2">
          <div className="card">
            <div className="section-title">Describe a segment</div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "big spenders who buy gift boxes but haven&apos;t visited in 2 months"'
            />
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-primary" disabled={previewing || !prompt.trim()} onClick={preview}>
                {previewing ? "Thinking…" : "Preview audience"}
              </button>
            </div>
          </div>
          <div className="card">
            <div className="section-title">Let AI suggest segments</div>
            <div className="muted" style={{ marginBottom: 10 }}>
              Looks at your own numbers (visit gaps, spend, categories, festivals) and proposes audiences worth
              messaging — with live sizes, nothing saved until you say so.
            </div>
            <button className="btn btn-ghost" disabled={discovering} onClick={discover}>
              {discovering ? "Studying your sales…" : "Suggest segments"}
            </button>
          </div>
        </div>
      )}

      {proposal && proposalCard(proposal, "custom")}
      {suggestions && suggestions.length > 0 && (
        <>
          <div className="section-title">AI suggestions</div>
          {suggestions.map((p) => proposalCard(p, "ai_suggested"))}
        </>
      )}

      <div className="section-title" style={{ marginTop: 16 }}>Your segments</div>
      {!segments ? (
        <div className="muted">Loading…</div>
      ) : (
        segments.map((s) => (
          <div className="card" key={s.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <strong>{s.name}</strong>
              <span className="badge badge-type">{TYPE_LABEL[s.campaignType] ?? s.campaignType}</span>
              <span className={`badge ${s.source === "ai_suggested" ? "badge-pending" : "badge-type"}`}>
                {SOURCE_LABEL[s.source]}
              </span>
              <span className="muted">{s.audienceSize} customers match today</span>
            </div>
            {s.description && <div className="muted" style={{ marginTop: 6 }}>{s.description}</div>}
            <div className="muted" style={{ fontSize: "0.8rem", margin: "6px 0 10px" }}>Rule: {ruleSummary(s.rule)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" disabled={busy === s.id} onClick={() => runCampaign(s)}>
                {busy === s.id ? "Working…" : "Create campaign now"}
              </button>
              {s.source !== "standard" && (
                <button className="btn btn-danger" disabled={busy === s.id} onClick={() => remove(s)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </AppShell>
  );
}
