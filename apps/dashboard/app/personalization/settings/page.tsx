"use client";

// Personalization > Settings — where the underlying customer/segment data
// lives (Master Data), how it gets in (Upload), and how to get it back out
// (Download). No new upload code: Upload just links to the existing POS CSV
// importer.

import { useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import BusinessUnitsCard from "../../../components/BusinessUnitsCard";
import { api, downloadFile } from "../../../lib/api";

interface SegmentItem {
  id: string;
  name: string;
}

export default function PersonalizationSettingsPage() {
  const [segments, setSegments] = useState<SegmentItem[]>([]);
  const [selectedSegment, setSelectedSegment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ segments: SegmentItem[] }>("/segments")
      .then((r) => {
        setSegments(r.segments);
        if (r.segments.length > 0) setSelectedSegment(r.segments[0].id);
      })
      .catch(() => setSegments([]));
  }, []);

  async function download(path: string, filename: string) {
    setError("");
    try {
      await downloadFile(path, filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <AppShell>
      <div className="page-title">Personalization Settings</div>
      <div className="page-sub">Your customer data — where it lives, how it gets in, and how to get it out.</div>
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Master Data</div>
          <div className="muted" style={{ marginBottom: 14 }}>
            Your customer directory and segments — the data every personalization feature is built on.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a className="btn btn-primary" style={{ display: "inline-block" }} href="/customers">
              Customer directory
            </a>
            <a className="btn btn-ghost" style={{ display: "inline-block" }} href="/segments">
              Segments
            </a>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Upload Data</div>
          <div className="muted" style={{ marginBottom: 14 }}>
            Import past sales from your POS export, or create online-order QR codes.
          </div>
          <a className="btn btn-primary" style={{ display: "inline-block" }} href="/data">
            Go to Upload Data
          </a>
        </div>

        <div className="card">
          <div className="section-title">Download Data</div>
          <div className="muted" style={{ marginBottom: 14 }}>
            Export your customer directory, or one segment's audience, as CSV.
          </div>
          <button className="btn btn-primary" style={{ marginBottom: 14 }} onClick={() => download("/customers/export.csv", "customers.csv")}>
            Export all customers (CSV)
          </button>
          {segments.length > 0 && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value)} style={{ maxWidth: 220 }}>
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-ghost"
                onClick={() =>
                  download(
                    `/segments/${selectedSegment}/export.csv`,
                    `segment-${segments.find((s) => s.id === selectedSegment)?.name ?? selectedSegment}.csv`
                  )
                }
              >
                Export segment audience (CSV)
              </button>
            </div>
          )}
        </div>

        <BusinessUnitsCard />
      </div>
    </AppShell>
  );
}
