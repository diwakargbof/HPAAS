"use client";

// Generate Bill — a tenant-invoked GST tax invoice for a sale: pick items,
// enter the customer's number, hit Generate. Delivered as a printable
// public page + WhatsApp + email (when the customer has one on file).

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "../../lib/api";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  gstRate: number | null;
  hsnCode: string | null;
}

interface BillingProfile {
  defaultGstRate?: number;
}

interface InvoiceLineItem {
  name: string;
  hsnCode: string;
  qty: number;
  unitPrice: number;
  gstRate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  lineTotal: number;
}

interface InvoiceView {
  invoiceNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  lineItems: InvoiceLineItem[];
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  discountAmount: number;
  createdAt: string;
  printUrl: string;
}

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+65", label: "🇸🇬 +65" },
  { code: "+61", label: "🇦🇺 +61" },
];

export default function BillingPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
  const [invoices, setInvoices] = useState<InvoiceView[] | null>(null);

  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [itemQty, setItemQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastInvoice, setLastInvoice] = useState<{ invoice: InvoiceView; delivery: { whatsapp: string; email: string } } | null>(null);

  const [discountOn, setDiscountOn] = useState(false);
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    api<{ items: MenuItem[] }>("/menu")
      .then((r) => setMenuItems(r.items.filter((it) => it.available)))
      .catch(() => setMenuItems([]));
    api<{ billingProfile: BillingProfile }>("/settings/billing")
      .then((r) => setBillingProfile(r.billingProfile))
      .catch(() => setBillingProfile({}));
    loadInvoices();
  }, []);

  function loadInvoices() {
    api<{ invoices: InvoiceView[] }>("/invoices")
      .then((r) => setInvoices(r.invoices))
      .catch(() => setInvoices([]));
  }

  const selectedItems = menuItems
    .filter((it) => (itemQty[it.id] ?? 0) > 0)
    .map((it) => ({
      name: it.name,
      category: it.category,
      qty: itemQty[it.id],
      unitPrice: it.price,
      gstRate: it.gstRate ?? billingProfile?.defaultGstRate ?? 0,
    }));
  const rawTaxable = selectedItems.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
  const rawTax = selectedItems.reduce((sum, it) => sum + (it.qty * it.unitPrice * it.gstRate) / 100, 0);
  const discountNum = Number(discountValue) || 0;
  const previewDiscountAmount = !discountOn
    ? 0
    : discountType === "percent"
      ? (rawTaxable * Math.min(100, Math.max(0, discountNum))) / 100
      : Math.min(Math.max(0, discountNum), rawTaxable);
  const discountFactor = rawTaxable > 0 ? (rawTaxable - previewDiscountAmount) / rawTaxable : 1;
  const previewTaxable = rawTaxable * discountFactor;
  const previewTax = rawTax * discountFactor;
  const previewTotal = previewTaxable + previewTax;
  const discountReady = !discountOn || (discountNum > 0 && employeeName.trim() && employeeId.trim());

  function setQty(id: string, qty: number) {
    setItemQty((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  }

  async function generateInvoice() {
    setBusy(true);
    setError("");
    setLastInvoice(null);
    try {
      const result = await api<{ invoice: InvoiceView; delivery: { whatsapp: string; email: string } }>("/invoices", {
        method: "POST",
        body: JSON.stringify({
          phone: `${countryCode}${phone.trim()}`,
          name: name.trim() || undefined,
          items: selectedItems.map(({ name, category, qty, unitPrice }) => ({ name, category, qty, unitPrice })),
          discount:
            discountOn && discountNum > 0
              ? {
                  type: discountType,
                  value: discountNum,
                  authorizedByName: employeeName.trim(),
                  authorizedById: employeeId.trim(),
                }
              : undefined,
        }),
      });
      setLastInvoice(result);
      setPhone("");
      setName("");
      setItemQty({});
      setDiscountOn(false);
      setDiscountValue("");
      setEmployeeName("");
      setEmployeeId("");
      loadInvoices();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="page-title">Generate Bill</div>
      <div className="page-sub">
        A proper GST tax invoice — itemized, with tax breakup and a sequential invoice number.
      </div>

      {billingProfile && !billingProfile.defaultGstRate && menuItems.every((it) => it.gstRate === null) && (
        <div className="notice" style={{ marginBottom: 20 }}>
          Add your business name and GSTIN under <a href="/settings/billing">Billing details</a> before
          generating invoices, and tag menu items with a GST rate for accurate tax lines.
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">New invoice</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ width: 100 }}>
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Customer phone"
            style={{ maxWidth: 220 }}
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name (optional)"
            style={{ maxWidth: 220 }}
          />
        </div>

        {menuItems.length > 0 ? (
          <div style={{ marginBottom: 14 }}>
            <div className="muted" style={{ marginBottom: 6 }}>
              What did they buy?
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                maxHeight: 200,
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
                    {it.name} <span className="muted">₹{it.price} · {it.gstRate ?? billingProfile?.defaultGstRate ?? 0}% GST</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={itemQty[it.id] ?? 0}
                    onChange={(e) => setQty(it.id, Number(e.target.value))}
                    style={{ width: 50 }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="notice" style={{ marginBottom: 14 }}>
            Add items to your <a href="/menu">menu</a> first.
          </div>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <input type="checkbox" checked={discountOn} onChange={(e) => setDiscountOn(e.target.checked)} style={{ width: "auto" }} />
          Apply a discount (familiar customer / employee discount)
        </label>

        {discountOn && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "flat")} style={{ width: 110 }}>
              <option value="percent">% off</option>
              <option value="flat">₹ flat off</option>
            </select>
            <input
              type="number"
              min={0}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "percent" ? "e.g. 10" : "e.g. 100"}
              style={{ maxWidth: 120 }}
            />
            <input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Employee name (required)"
              style={{ maxWidth: 200 }}
            />
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Employee ID (required)"
              style={{ maxWidth: 160 }}
            />
          </div>
        )}

        <div className="muted" style={{ marginBottom: 14 }}>
          {previewDiscountAmount > 0 && <>Discount: −₹{previewDiscountAmount.toFixed(2)} &nbsp; </>}
          Taxable: ₹{previewTaxable.toFixed(2)} &nbsp; Tax (CGST+SGST): ₹{previewTax.toFixed(2)} &nbsp;
          <strong>Total: ₹{previewTotal.toFixed(2)}</strong>
        </div>

        <button
          className="btn btn-primary"
          disabled={busy || !phone.trim() || selectedItems.length === 0 || !discountReady}
          onClick={generateInvoice}
        >
          {busy ? "Generating…" : "Generate Invoice"}
        </button>
        {discountOn && discountNum > 0 && !discountReady && (
          <div className="muted" style={{ marginTop: 8, fontSize: "0.85rem" }}>
            Employee name and ID are required to apply a discount.
          </div>
        )}
        {error && <div className="error-text" style={{ marginTop: 10 }}>{error}</div>}

        {lastInvoice && (
          <div className="notice" style={{ marginTop: 14 }}>
            Invoice <strong>{lastInvoice.invoice.invoiceNumber}</strong> created — total ₹
            {lastInvoice.invoice.totalAmount.toFixed(2)}.{" "}
            <a href={lastInvoice.invoice.printUrl} target="_blank" rel="noreferrer">
              Open / print
            </a>
            <div className="muted" style={{ fontSize: "0.85rem", marginTop: 4 }}>
              WhatsApp: {lastInvoice.delivery.whatsapp} · Email: {lastInvoice.delivery.email}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title">Past invoices</div>
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th className="num">Total</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices?.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">No invoices yet.</td>
              </tr>
            )}
            {invoices?.map((inv) => (
              <tr key={inv.invoiceNumber}>
                <td>{inv.invoiceNumber}</td>
                <td>
                  {inv.customerName ?? "—"} <span className="muted">{inv.customerPhone}</span>
                </td>
                <td className="num">₹{inv.totalAmount.toFixed(2)}</td>
                <td className="muted">{new Date(inv.createdAt).toLocaleDateString("en-IN")}</td>
                <td>
                  <a href={inv.printUrl} target="_blank" rel="noreferrer">
                    Print
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
