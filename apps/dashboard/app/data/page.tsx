"use client";

// CSV upload hitting the real ingestion endpoint, plus upload history and
// an "expected columns" hint derived from the tenant's own POS mapping.

import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "../../components/AppShell";
import { api, getSession } from "../../lib/api";

interface Upload {
  id: string;
  filename: string;
  status: "processing" | "success" | "error";
  rowsProcessed: number;
  errorLog: string | null;
  uploadedAt: string;
}

export default function DataPage() {
  const [uploads, setUploads] = useState<Upload[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const mapping = getSession()?.tenant.config.posColumnMapping;
  const expectedColumns = mapping
    ? [mapping.phone, mapping.name, mapping.email, mapping.timestamp, mapping.items, mapping.amount, mapping.locationId].filter(Boolean)
    : [];

  const load = useCallback(() => {
    api<{ uploads: Upload[] }>("/uploads")
      .then((r) => setUploads(r.uploads))
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  useEffect(load, [load]);

  async function upload(file: File) {
    setBusy(true);
    setError("");
    setLastResult("");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api<{ rowsProcessed: number; rowErrors: unknown[] }>("/uploads", {
        method: "POST",
        body: form,
      });
      setLastResult(
        `Done! ${result.rowsProcessed} bills imported` +
          (result.rowErrors.length ? ` (${result.rowErrors.length} rows skipped — see history)` : "")
      );
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <AppShell>
      <div className="page-title">Upload Data</div>
      <div className="page-sub">Bring in your latest billing export — we&apos;ll take care of the rest.</div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Upload a billing CSV</div>
        <div className="notice">
          Expected columns (from your POS format): <strong>{expectedColumns.join(", ")}</strong>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
        {busy && <div className="muted" style={{ marginTop: 10 }}>Uploading and processing…</div>}
        {lastResult && <div className="good-text" style={{ marginTop: 10 }}>{lastResult}</div>}
        {error && <div className="error-text">{error}</div>}
      </div>

      <div className="card">
        <div className="section-title">Upload history</div>
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>When</th>
              <th>Status</th>
              <th className="num">Rows</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {(uploads ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No uploads yet.
                </td>
              </tr>
            )}
            {(uploads ?? []).map((u) => (
              <tr key={u.id}>
                <td>{u.filename}</td>
                <td className="muted">{new Date(u.uploadedAt).toLocaleString()}</td>
                <td>
                  <span className={`badge badge-${u.status === "success" ? "sent" : u.status === "error" ? "rejected" : "pending"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="num">{u.rowsProcessed}</td>
                <td className="muted" style={{ fontSize: "0.85rem", maxWidth: 280 }}>
                  {u.errorLog ? u.errorLog.split("\n").slice(0, 2).join("; ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
