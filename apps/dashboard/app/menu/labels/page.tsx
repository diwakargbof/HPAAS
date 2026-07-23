"use client";

// Printable price-tag sheet for selected menu items — no AppShell chrome,
// just a label grid sized for a standard sheet and the browser's own
// print dialog. No backend changes: renders from GET /menu.

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSession, api } from "../../../lib/api";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  gstRate: number | null;
}

function LabelsContent() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const shopName = getSession()?.tenant.config.branding.shopName ?? "";

  useEffect(() => {
    if (!getSession()) {
      window.location.href = "/";
      return;
    }
    api<{ items: MenuItem[] }>("/menu")
      .then((r) => setItems(r.items.filter((it) => ids.includes(it.id))))
      .catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!items) {
    return <div style={{ padding: 24, fontFamily: "system-ui" }}>Loading…</div>;
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <div className="no-print" style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: "#8b4513",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Print
        </button>
        <a
          href="/menu"
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "1px solid #ccc",
            color: "#333",
            textDecoration: "none",
          }}
        >
          Back to Master Data
        </a>
      </div>

      {items.length === 0 ? (
        <div>No items to print.</div>
      ) : (
        <div className="label-grid">
          {items.map((item) => (
            <div className="label" key={item.id}>
              <div className="label-shop">{shopName}</div>
              <div className="label-name">{item.name}</div>
              <div className="label-price">₹{item.price}</div>
              {item.gstRate !== null && <div className="label-gst">Incl. GST {item.gstRate}%</div>}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .label-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .label {
          border: 1px dashed #999;
          border-radius: 6px;
          padding: 14px;
          text-align: center;
          break-inside: avoid;
        }
        .label-shop {
          font-size: 0.7rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .label-name {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .label-price {
          font-size: 1.4rem;
          font-weight: 800;
        }
        .label-gst {
          font-size: 0.7rem;
          color: #888;
          margin-top: 4px;
        }
        @media print {
          .no-print {
            display: none;
          }
          .label-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default function LabelsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, fontFamily: "system-ui" }}>Loading…</div>}>
      <LabelsContent />
    </Suspense>
  );
}
