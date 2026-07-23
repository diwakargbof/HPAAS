"use client";

// THE approval queue. Pending campaigns show exactly what will go out and
// to how many people. Nothing sends without a tap on "Approve & Send".

import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api, downloadFile } from "../../lib/api";

interface SegmentItem {
  id: string;
  name: string;
  campaignType: string;
  audienceSize: number;
}

interface CampaignItem {
  id: string;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  audienceSize: number;
  segmentName: string;
  campaignType: string;
  copy: {
    template: string;
    samples: Array<{ profileId: string; rendered: string }>;
  } | null;
  stats: {
    total: number;
    control: number;
    sent: number;
    delivered: number;
    read: number;
    replied: number;
    failed: number;
  };
  attribution: {
    incrementalRepeatRate: number;
    incrementalRevenuePerCustomer: number;
    messagedCount: number;
    redemptions: number;
  } | null;
  hasCallList: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  winback: "Win-back",
  festival_preorder: "Festival pre-order",
  new_item_alert: "New item alert",
  reorder_reminder: "Reorder reminder",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState("");
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [segments, setSegments] = useState<SegmentItem[] | null>(null);

  const load = useCallback(() => {
    api<{ campaigns: CampaignItem[] }>("/campaigns")
      .then((r) => setCampaigns(r.campaigns))
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  useEffect(load, [load]);

  function openCreator() {
    setCreatorOpen((o) => !o);
    if (!segments) {
      api<{ segments: SegmentItem[] }>("/segments")
        .then((r) => setSegments(r.segments))
        .catch(() => setSegments([]));
    }
  }

  async function createFromSegment(segment: SegmentItem) {
    setBusyId(segment.id);
    setError("");
    setNotice("");
    try {
      const r = await api<{ result: { outcome: string; reason?: string; audienceSize?: number } }>(
        `/segments/${segment.id}/run`,
        { method: "POST" }
      );
      setNotice(
        r.result.outcome === "campaign_created"
          ? `Campaign created for "${segment.name}" (${r.result.audienceSize} customers) — see it below.`
          : `Nothing created for "${segment.name}": ${r.result.reason}.`
      );
      setCreatorOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId("");
    }
  }

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError("");
    try {
      await api(`/campaigns/${id}/${action}`, { method: "POST" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId("");
    }
  }

  async function saveTemplate(id: string) {
    setBusyId(id);
    setError("");
    try {
      await api(`/campaigns/${id}/template`, {
        method: "PUT",
        body: JSON.stringify({ template: draft }),
      });
      setEditingId("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId("");
    }
  }

  const pending = campaigns?.filter((c) => c.status === "pending_approval") ?? [];
  const history = campaigns?.filter((c) => c.status !== "pending_approval") ?? [];

  return (
    <AppShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div className="page-title">Campaigns</div>
          <div className="page-sub">
            Messages wait here for your OK. Nothing is sent until you approve it.
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button className="btn btn-primary" onClick={openCreator}>
            {creatorOpen ? "Close" : "+ Create Campaign"}
          </button>
          {creatorOpen && (
            <div className="card" style={{ position: "absolute", right: 0, top: 44, zIndex: 10, width: 320, padding: 10 }}>
              <div className="muted" style={{ fontSize: "0.85rem", padding: "4px 8px 10px" }}>
                Pick a segment to turn into a campaign right now.
              </div>
              {!segments ? (
                <div className="muted" style={{ padding: "0 8px" }}>Loading…</div>
              ) : segments.length === 0 ? (
                <div className="muted" style={{ padding: "0 8px" }}>
                  No segments yet — <a href="/segments">create one first</a>.
                </div>
              ) : (
                segments.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => (busyId ? undefined : createFromSegment(s))}
                    style={{ padding: "8px 8px", borderRadius: 8, cursor: busyId ? "default" : "pointer", opacity: busyId && busyId !== s.id ? 0.5 : 1 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontWeight: 600 }}>{busyId === s.id ? "Creating…" : s.name}</div>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {TYPE_LABEL[s.campaignType] ?? s.campaignType} · {s.audienceSize} customers today
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      {error && <div className="error-text">{error}</div>}
      {notice && <div className="notice">{notice}</div>}
      {!campaigns ? (
        <div className="muted">Loading…</div>
      ) : (
        <>
          <div className="section-title">Waiting for your approval ({pending.length})</div>
          {pending.length === 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <span className="muted">Nothing waiting right now. New campaigns appear here automatically.</span>
            </div>
          )}
          {pending.map((c) => (
            <div className="card" key={c.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <span className="badge badge-type">{TYPE_LABEL[c.campaignType] ?? c.campaignType}</span>
                <strong>{c.segmentName}</strong>
                <span className="muted">
                  → {c.audienceSize} customers ({c.stats.control} kept aside to measure impact)
                </span>
              </div>

              {editingId === c.id ? (
                <>
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
                  <div className="muted" style={{ fontSize: "0.85rem", margin: "6px 0 10px" }}>
                    You can use: {"{{name}} {{favorite_item}} {{category}} {{days_since_visit}} {{shop_name}} {{redemption_code}} {{festival_name}}"}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary" disabled={busyId === c.id} onClick={() => saveTemplate(c.id)}>
                      Save message
                    </button>
                    <button className="btn btn-ghost" onClick={() => setEditingId("")}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="muted" style={{ fontSize: "0.85rem", marginBottom: 6 }}>
                    Here&apos;s how it will read for a few of your customers:
                  </div>
                  {(c.copy?.samples ?? []).map((s) => (
                    <div className="msg-preview" key={s.profileId}>
                      {s.rendered}
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="btn btn-primary" disabled={busyId === c.id} onClick={() => act(c.id, "approve")}>
                      {busyId === c.id ? "Sending…" : "Approve & Send"}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditingId(c.id);
                        setDraft(c.copy?.template ?? "");
                      }}
                    >
                      Edit message
                    </button>
                    <button className="btn btn-danger" disabled={busyId === c.id} onClick={() => act(c.id, "reject")}>
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          <div className="section-title" style={{ marginTop: 28 }}>
            History
          </div>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th className="num">Sent</th>
                  <th className="num">Replied</th>
                  <th className="num">Codes used</th>
                  <th className="num">Extra revenue</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted">
                      No campaigns sent yet.
                    </td>
                  </tr>
                )}
                {history.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="badge badge-type">{TYPE_LABEL[c.campaignType] ?? c.campaignType}</span>{" "}
                      {c.segmentName}
                    </td>
                    <td>
                      <span className={`badge badge-${c.status === "sent" ? "sent" : c.status === "rejected" ? "rejected" : "pending"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="num">{c.stats.sent}</td>
                    <td className="num">{c.stats.replied}</td>
                    <td className="num">{c.attribution?.redemptions ?? "—"}</td>
                    <td className="num">
                      {c.attribution
                        ? `₹${Math.round(
                            c.attribution.incrementalRevenuePerCustomer * c.attribution.messagedCount
                          ).toLocaleString("en-IN")}`
                        : "—"}
                    </td>
                    <td>
                      {c.hasCallList && (
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 10px", fontSize: "0.82rem" }}
                          onClick={() => downloadFile(`/campaigns/${c.id}/call-list.csv`, `call-list-${c.id.slice(0, 8)}.csv`)}
                        >
                          Call list
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}
