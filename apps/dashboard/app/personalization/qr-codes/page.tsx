"use client";

// Online order QR codes — Swiggy/Zomato don't share customer numbers, so
// one QR per online order lets the customer opt into WhatsApp (and the
// customer pool) themselves by scanning and sending a pre-drafted message.
// Moved out of Upload Data into its own section since it's a distinct
// workflow, not a CSV import.

import { useCallback, useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import { api } from "../../../lib/api";

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

export default function QrCodesPage() {
  const [qrOrders, setQrOrders] = useState<QrOrderRow[] | null>(null);
  const [qrRef, setQrRef] = useState("");
  const [qrSource, setQrSource] = useState("swiggy");
  const [qrBusy, setQrBusy] = useState(false);
  const [qrError, setQrError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [qrItemQty, setQrItemQty] = useState<Record<string, number>>({});

  const load = useCallback(() => {
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

  async function createQr() {
    setQrBusy(true);
    setQrError("");
    try {
      await api("/qr-orders", {
        method: "POST",
        body: JSON.stringify({
          order_ref: qrRef.trim(),
          amount: selectedTotal,
          source: qrSource,
          items: selectedItems,
        }),
      });
      setQrRef("");
      setQrItemQty({});
      load();
    } catch (e) {
      setQrError(e instanceof Error ? e.message : String(e));
    } finally {
      setQrBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="page-title">Online Order QR Codes</div>
      <div className="page-sub">
        Swiggy &amp; Zomato don&apos;t share customer numbers. Print one QR per online order —
        when the customer scans it, WhatsApp opens with a ready message to you, and the moment
        they hit send, they (and their order) join your customer list.
      </div>

      <div className="card">
        {menuItems.length === 0 && (
          <div className="notice" style={{ marginBottom: 14 }}>
            Add items to your <a href="/menu">menu</a> first — the QR amount is calculated from
            the items you pick, so there&apos;s nothing to select yet.
          </div>
        )}
        {menuItems.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="muted" style={{ marginBottom: 6 }}>
              What did they buy? (the amount below is calculated from your picks)
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
          <div className="muted" style={{ width: 120 }}>
            Amount: <strong>₹{selectedTotal}</strong>
          </div>
          <select value={qrSource} onChange={(e) => setQrSource(e.target.value)}>
            <option value="swiggy">Swiggy</option>
            <option value="zomato">Zomato</option>
            <option value="ondc">ONDC</option>
            <option value="other">Other</option>
          </select>
          <button
            className="btn btn-primary"
            disabled={qrBusy || !qrRef.trim() || selectedItems.length === 0}
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
    </AppShell>
  );
}
