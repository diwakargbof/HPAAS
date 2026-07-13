"use client";

// CSV upload hitting the real ingestion endpoint, plus upload history and
// an "expected columns" hint derived from the tenant's own POS mapping.
// Also the QR-capture desk: one QR per online (Swiggy/Zomato) order that
// pulls the customer into WhatsApp — and into the system.

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

interface QrOrderRow {
  id: string;
  token: string;
  orderRef: string;
  source: string;
  amount: number;
  status: "pending" | "claimed";
  claimedAt: string | null;
  createdAt: string;
  claimUrl: string;
  qrSvgUrl: string;
  waLink: string;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
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

  const [qrOrders, setQrOrders] = useState<QrOrderRow[] | null>(null);
  const [qrRef, setQrRef] = useState("");
  const [qrAmount, setQrAmount] = useState("");
  const [qrSource, setQrSource] = useState("swiggy");
  const [qrBusy, setQrBusy] = useState(false);
  const [qrError, setQrError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [qrItemQty, setQrItemQty] = useState<Record<string, number>>({});
  const [amountTouched, setAmountTouched] = useState(false);

  const load = useCallback(() => {
    api<{ uploads: Upload[] }>("/uploads")
      .then((r) => setUploads(r.uploads))
      .catch((e) => setError(String(e.message ?? e)));
    api<{ qrOrders: QrOrderRow[] }>("/qr-orders")
      .then((r) => setQrOrders(r.qrOrders))
      .catch((e) => setQrError(String(e.message ?? e)));
    api<{ items: MenuItem[] }>("/menu")
      .then((r) => setMenuItems(r.items.filter((it) => it.available)))
      .catch(() => setMenuItems([]));
  }, []);

  useEffect(load, [load]);

  const selectedItems = menuItems
    .filter((it) => (qrItemQty[it.id] ?? 0) > 0)
    .map((it) => ({ name: it.name, category: it.category, qty: qrItemQty[it.id], unitPrice: it.price }));
  const selectedTotal = selectedItems.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);

  function setItemQty(id: string, qty: number) {
    setQrItemQty((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  }

  // Keep the amount in sync with the picked items unless the shop owner has
  // manually overridden it (aggregator payout can differ from menu price).
  useEffect(() => {
    if (!amountTouched && selectedItems.length > 0) {
      setQrAmount(String(selectedTotal));
    }
  }, [selectedTotal, selectedItems.length, amountTouched]);

  async function createQr() {
    setQrBusy(true);
    setQrError("");
    try {
      await api("/qr-orders", {
        method: "POST",
        body: JSON.stringify({
          order_ref: qrRef.trim(),
          amount: Number(qrAmount),
          source: qrSource,
          items: selectedItems,
        }),
      });
      setQrRef("");
      setQrAmount("");
      setQrItemQty({});
      setAmountTouched(false);
      load();
    } catch (e) {
      setQrError(e instanceof Error ? e.message : String(e));
    } finally {
      setQrBusy(false);
    }
  }

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

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Online order QR codes</div>
        <div className="muted" style={{ marginBottom: 10 }}>
          Swiggy &amp; Zomato don&apos;t share customer numbers. Print one QR per online order —
          when the customer scans it, WhatsApp opens with a ready message to you, and the moment
          they hit send, they (and their order) join your customer list.
        </div>
        {menuItems.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="muted" style={{ marginBottom: 6 }}>
              What did they buy? (optional — fills the amount below automatically)
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                maxHeight: 160,
                overflowY: "auto",
                border: "1px solid var(--border, #e2e2e2)",
                borderRadius: 8,
                padding: 10,
              }}
            >
              {menuItems.map((it) => (
                <div
                  key={it.id}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", border: "1px solid var(--border, #e2e2e2)", borderRadius: 6 }}
                >
                  <span style={{ fontSize: "0.85rem" }}>
                    {it.name} <span className="muted">₹{it.price}</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={qrItemQty[it.id] ?? 0}
                    onChange={(e) => setItemQty(it.id, Number(e.target.value))}
                    style={{ width: 50 }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <input
            placeholder="Order ref (e.g. SWG-48291)"
            value={qrRef}
            onChange={(e) => setQrRef(e.target.value)}
            style={{ width: 200 }}
          />
          <input
            type="number"
            placeholder="Amount ₹"
            min={0}
            value={qrAmount}
            onChange={(e) => {
              setAmountTouched(true);
              setQrAmount(e.target.value);
            }}
            style={{ width: 120 }}
          />
          <select value={qrSource} onChange={(e) => setQrSource(e.target.value)}>
            <option value="swiggy">Swiggy</option>
            <option value="zomato">Zomato</option>
            <option value="ondc">ONDC</option>
            <option value="other">Other</option>
          </select>
          <button
            className="btn btn-primary"
            disabled={qrBusy || !qrRef.trim() || !(Number(qrAmount) >= 0 && qrAmount !== "")}
            onClick={createQr}
          >
            Create QR
          </button>
        </div>
        {qrError && <div className="error-text">{qrError}</div>}
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Source</th>
              <th className="num">Amount</th>
              <th>Created</th>
              <th>Status</th>
              <th>QR</th>
            </tr>
          </thead>
          <tbody>
            {(qrOrders ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No QR orders yet — create one per online order, or POST /v1/qr-orders from your
                  order screen.
                </td>
              </tr>
            )}
            {(qrOrders ?? []).map((q) => (
              <tr key={q.id}>
                <td>{q.orderRef}</td>
                <td className="muted">{q.source}</td>
                <td className="num">₹{Math.round(q.amount)}</td>
                <td className="muted">{new Date(q.createdAt).toLocaleString()}</td>
                <td>
                  <span className={`badge badge-${q.status === "claimed" ? "sent" : "pending"}`}>
                    {q.status === "claimed" ? "customer joined ✓" : "waiting for scan"}
                  </span>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <a href={q.qrSvgUrl} target="_blank" rel="noreferrer">
                    print QR
                  </a>
                  {" · "}
                  <a
                    href={q.claimUrl}
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(q.claimUrl);
                      setCopiedId(q.id);
                      setTimeout(() => setCopiedId(""), 1500);
                    }}
                  >
                    {copiedId === q.id ? "copied ✓" : "copy link"}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
