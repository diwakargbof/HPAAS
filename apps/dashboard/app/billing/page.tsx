"use client";

// Generate Bill — a tenant-invoked GST tax invoice for a sale: pick items,
// enter the customer's number, hit Generate. Delivered as a printable
// public page + WhatsApp + email (when the customer has one on file).
//
// The phone number entered here also drives the same "at the counter" lookup
// that used to live on its own page — identity, loyalty balance, suggestions,
// award/redeem, a personal note — so the tenant never types the number twice.

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api, getSession } from "../../lib/api";
import { useBusinessUnits } from "../../lib/businessUnits";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  gstRate: number | null;
  hsnCode: string | null;
  branchPrice: number | null;
}

interface BillingProfile {
  defaultGstRate?: number;
}

interface CounterCard {
  profileId: string;
  name: string | null;
  phone: string;
  lastVisitDays: number | null;
  favoriteItem: string | null;
  loyalty: { balance: number; valueRupees: number };
  recommendations: Array<{
    item: string;
    category: string;
    price: number | null;
    reason: string;
    signal: string;
  }>;
  pitch: string;
  activeFestival: string | null;
}

interface LedgerEntry {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
}

interface DirectMsg {
  id: string;
  body: string;
  status: string;
  sentAt: string;
}

const SIGNAL_LABEL: Record<string, string> = {
  due_reorder: "their usual",
  pairs_with: "pairs well",
  category_new: "new for them",
  festival: "festive",
};

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
  const { units: businessUnits, active: businessUnitsActive } = useBusinessUnits();
  const [businessUnitId, setBusinessUnitId] = useState("");
  const [itemQty, setItemQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastInvoice, setLastInvoice] = useState<{ invoice: InvoiceView; delivery: { whatsapp: string; email: string } } | null>(null);

  const [discountOn, setDiscountOn] = useState(false);
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [card, setCard] = useState<CounterCard | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [recentMessages, setRecentMessages] = useState<DirectMsg[]>([]);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [counterLoading, setCounterLoading] = useState(false);
  const [counterBusy, setCounterBusy] = useState("");
  const [points, setPoints] = useState(50);
  const [pointsReason, setPointsReason] = useState("");
  const [note, setNote] = useState("");

  const fullPhone = phone.trim() ? `${countryCode}${phone.trim()}` : "";
  const loyaltyEnabled = Boolean(getSession()?.tenant.config.modules.loyalty?.enabled);

  function resetCustomerLookup() {
    setCard(null);
    setLedger([]);
    setRecentMessages([]);
    setIsNewCustomer(false);
  }

  async function lookupCustomer(refresh = false) {
    if (!loyaltyEnabled || !phone.trim()) return;
    setCounterLoading(true);
    setIsNewCustomer(false);
    if (!refresh) {
      setCard(null);
      setLedger([]);
      setRecentMessages([]);
    }
    try {
      const r = await api<{ card: CounterCard; ledger: LedgerEntry[]; recentMessages: DirectMsg[] }>(
        `/counter?phone=${encodeURIComponent(fullPhone)}${refresh ? "&refresh=1" : ""}`
      );
      setCard(r.card);
      setLedger(r.ledger);
      setRecentMessages(r.recentMessages);
    } catch (e) {
      if (e instanceof Error && (e as Error & { status?: number }).status === 404) {
        setIsNewCustomer(true);
      }
      // Any other lookup error is silent here — Generate Invoice below still works
      // without a customer card; the invoice route surfaces its own errors.
    } finally {
      setCounterLoading(false);
    }
  }

  async function adjustPoints(sign: 1 | -1) {
    if (!card || !points) return;
    setCounterBusy("points");
    setError("");
    try {
      const r = await api<{ balance: number }>("/loyalty/adjust", {
        method: "POST",
        body: JSON.stringify({
          profileId: card.profileId,
          points: sign * Math.abs(points),
          reason: pointsReason.trim() || (sign > 0 ? "Bonus at the counter" : "Redeemed at the counter"),
        }),
      });
      setCard({ ...card, loyalty: { ...card.loyalty, balance: r.balance } });
      setPointsReason("");
      lookupCustomer(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCounterBusy("");
    }
  }

  async function sendNote() {
    if (!card || !note.trim()) return;
    setCounterBusy("note");
    setError("");
    try {
      await api("/direct-message", {
        method: "POST",
        body: JSON.stringify({ profileId: card.profileId, body: note.trim() }),
      });
      setNote("");
      lookupCustomer(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCounterBusy("");
    }
  }

  async function registerWithoutBill() {
    if (!name.trim() || !phone.trim()) return;
    setCounterBusy("register");
    setError("");
    try {
      await api("/counter/new-customer", {
        method: "POST",
        body: JSON.stringify({ phone: fullPhone, name: name.trim(), items: [] }),
      });
      setIsNewCustomer(false);
      lookupCustomer(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCounterBusy("");
    }
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (businessUnitId) params.set("businessUnitId", businessUnitId);
    api<{ items: MenuItem[] }>(`/menu${params.toString() ? `?${params.toString()}` : ""}`)
      .then((r) => setMenuItems(r.items.filter((it) => it.available)))
      .catch(() => setMenuItems([]));
  }, [businessUnitId]);

  useEffect(() => {
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
      unitPrice: it.branchPrice ?? it.price,
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
          businessUnitId: businessUnitId || undefined,
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
      setBusinessUnitId("");
      setItemQty({});
      setDiscountOn(false);
      setDiscountValue("");
      setEmployeeName("");
      setEmployeeId("");
      resetCustomerLookup();
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
            onChange={(e) => {
              setPhone(e.target.value);
              if (card || isNewCustomer) resetCustomerLookup();
            }}
            onBlur={() => lookupCustomer(false)}
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
          {businessUnitsActive && (
            <select value={businessUnitId} onChange={(e) => setBusinessUnitId(e.target.value)} style={{ width: 180 }}>
              <option value="">No branch</option>
              {businessUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {counterLoading && <div className="muted" style={{ marginBottom: 14 }}>Looking up customer…</div>}

        {isNewCustomer && (
          <div className="notice" style={{ marginBottom: 14 }}>
            No one&apos;s bought from you with this number yet — it&apos;ll be added automatically once you
            generate the invoice below.{" "}
            {name.trim() && (
              <button
                className="btn btn-ghost"
                style={{ padding: "3px 10px", fontSize: "0.82rem", marginLeft: 6 }}
                disabled={counterBusy === "register"}
                onClick={registerWithoutBill}
              >
                {counterBusy === "register" ? "Adding…" : "Or add them now without a bill"}
              </button>
            )}
          </div>
        )}

        {card && (
          <div className="grid grid-2" style={{ marginBottom: 14 }}>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div className="stat-label">Customer</div>
                  <div className="stat-value" style={{ fontSize: "1.4rem" }}>{card.name ?? "No name yet"}</div>
                  <div className="muted">{card.phone}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="stat-label">Points</div>
                  <div className="stat-value" style={{ fontSize: "1.4rem" }}>{card.loyalty.balance}</div>
                  <div className="muted">≈ ₹{card.loyalty.valueRupees}</div>
                </div>
              </div>
              <table style={{ marginTop: 10 }}>
                <tbody>
                  <tr>
                    <td className="muted">Last visit</td>
                    <td>{card.lastVisitDays === null ? "—" : `${card.lastVisitDays} days ago`}</td>
                  </tr>
                  <tr>
                    <td className="muted">Favorite</td>
                    <td>{card.favoriteItem ?? "—"}</td>
                  </tr>
                  {card.activeFestival && (
                    <tr>
                      <td className="muted">Coming up</td>
                      <td>{card.activeFestival}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="msg-preview" style={{ maxWidth: "none", fontStyle: "italic", marginTop: 10 }}>
                💬 {card.pitch}
              </div>
              {card.recommendations.map((r) => (
                <div key={r.item} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                  <strong>{r.item}</strong>
                  {r.price !== null && <span className="muted">₹{r.price}</span>}
                  <span className="badge badge-type">{SIGNAL_LABEL[r.signal] ?? r.signal}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="section-title">Points &amp; a personal note</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                <input
                  type="number"
                  min={1}
                  value={points}
                  onChange={(e) => setPoints(Math.max(1, Number(e.target.value) || 1))}
                  style={{ width: 90 }}
                />
                <input
                  type="text"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="Reason (optional)"
                  style={{ maxWidth: 180 }}
                />
                <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "0.82rem" }} disabled={counterBusy === "points"} onClick={() => adjustPoints(1)}>
                  Award
                </button>
                <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: "0.82rem" }} disabled={counterBusy === "points"} onClick={() => adjustPoints(-1)}>
                  Redeem
                </button>
              </div>
              <table style={{ marginBottom: 10 }}>
                <tbody>
                  {ledger.length === 0 && (
                    <tr>
                      <td className="muted">No points activity yet.</td>
                    </tr>
                  )}
                  {ledger.slice(0, 3).map((l) => (
                    <tr key={l.id}>
                      <td className="muted">{new Date(l.createdAt).toLocaleDateString()}</td>
                      <td>{l.reason}</td>
                      <td className="num" style={{ color: l.points >= 0 ? "var(--good)" : "var(--bad)" }}>
                        {l.points >= 0 ? `+${l.points}` : l.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={`e.g. "Namaste! Your favorite ${card.favoriteItem ?? "sweets"} are fresh today — see you soon?"`}
              />
              <div style={{ marginTop: 10 }}>
                <button className="btn btn-primary" disabled={counterBusy === "note" || !note.trim()} onClick={sendNote}>
                  {counterBusy === "note" ? "Sending…" : "Send WhatsApp"}
                </button>
              </div>
              {recentMessages.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="stat-label" style={{ marginBottom: 6 }}>Recent notes</div>
                  {recentMessages.slice(0, 3).map((m) => (
                    <div className="msg-preview" key={m.id}>
                      {m.body}
                      <div className="muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
                        {new Date(m.sentAt).toLocaleString()} · {m.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
                    {it.name}{" "}
                    <span className="muted">
                      ₹{it.branchPrice ?? it.price}
                      {it.branchPrice !== null && it.branchPrice !== it.price ? ` (base ₹${it.price})` : ""} ·{" "}
                      {it.gstRate ?? billingProfile?.defaultGstRate ?? 0}% GST
                    </span>
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
