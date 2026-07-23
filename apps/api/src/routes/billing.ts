// GST e-billing: tenant fills in their own business/GST details once
// (settings/billing), then generates tax invoices for a sale — itemized
// lines with CGST/SGST breakup, sequential invoice numbers, delivered via
// a printable public page + WhatsApp + email. See KNOWLEDGE_GRAPH.md for
// the deliberate scope limits (intra-state only, no e-invoice IRN).

import { Router } from "express";
import {
  applyInvoiceDiscount,
  computeInvoiceLines,
  generateInvoiceToken,
  ingestNormalizedEvents,
  menuItemsByName,
} from "@hpas/core";
import { sendInvoiceEmail, sendTransactionalWhatsApp } from "@hpas/channels";
import {
  billingProfileConfig,
  billingProfileIsComplete,
  type BillingProfileConfig,
  type EventItem,
  type Invoice,
  type Tenant,
} from "@hpas/types";
import {
  createInvoice,
  getInvoiceByToken,
  getProfileByPhone,
  getTenantById,
  listInvoices,
  listMenuItems,
  patchTenantConfig,
  upsertProfile,
} from "@hpas/db";
import { normalizePhone } from "@hpas/core";

export const billingRouter: import("express").Router = Router();

function publicBaseUrl(req: import("express").Request): string {
  return process.env.PUBLIC_API_URL ?? `${req.protocol}://${req.get("host")}`;
}

function invoiceView(req: import("express").Request, invoice: Invoice) {
  return { ...invoice, printUrl: `${publicBaseUrl(req)}/i/${invoice.token}` };
}

billingRouter.get("/settings/billing", (req, res) => {
  res.json({ billingProfile: billingProfileConfig(req.tenant!.config) });
});

billingRouter.put("/settings/billing", async (req, res) => {
  const tenant = req.tenant!;
  const body = req.body?.billingProfile ?? {};

  const gstin = String(body.gstin ?? "").trim().toUpperCase();
  if (gstin && !/^[0-9A-Z]{15}$/.test(gstin)) {
    res.status(400).json({ error: "GSTIN must be 15 alphanumeric characters" });
    return;
  }

  const patch: { billingProfile: BillingProfileConfig } = {
    billingProfile: {
      ...(body.legalName ? { legalName: String(body.legalName).trim().slice(0, 200) } : {}),
      ...(gstin ? { gstin } : {}),
      ...(body.pan ? { pan: String(body.pan).trim().toUpperCase().slice(0, 10) } : {}),
      ...(Array.isArray(body.addressLines)
        ? { addressLines: body.addressLines.map((l: unknown) => String(l).slice(0, 200)).slice(0, 5) }
        : {}),
      ...(body.state ? { state: String(body.state).trim().slice(0, 100) } : {}),
      ...(body.invoicePrefix
        ? { invoicePrefix: String(body.invoicePrefix).replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10) }
        : {}),
      ...(body.defaultGstRate !== undefined
        ? { defaultGstRate: Math.max(0, Math.min(28, Number(body.defaultGstRate) || 0)) }
        : {}),
      ...(body.defaultHsnCode ? { defaultHsnCode: String(body.defaultHsnCode).trim().slice(0, 20) } : {}),
    },
  };

  await patchTenantConfig(tenant.id, patch);
  res.json({ ok: true });
});

/**
 * Generate a GST invoice for a sale. Tenant-invoked (Billing page): looks
 * up/creates the customer profile, resolves each item's tax rate/HSN from
 * the menu catalog (falling back to the tenant's billing-profile defaults),
 * computes the CGST/SGST breakup, and attempts WhatsApp + email delivery.
 */
billingRouter.post("/invoices", async (req, res) => {
  const tenant = req.tenant!;
  const billing = billingProfileConfig(tenant.config);
  if (!billingProfileIsComplete(billing)) {
    res.status(409).json({
      error: "Add your business name and GSTIN under Settings → Billing before generating invoices",
    });
    return;
  }

  const phone = normalizePhone(String(req.body?.phone ?? ""));
  const name = String(req.body?.name ?? "").trim();
  const businessUnitId = String(req.body?.businessUnitId ?? "").trim() || null;
  if (!phone) {
    res.status(400).json({ error: "valid phone is required" });
    return;
  }
  const items: EventItem[] = Array.isArray(req.body?.items)
    ? req.body.items.map((it: Partial<EventItem>) => ({
        name: String(it.name ?? ""),
        category: String(it.category ?? "uncategorized"),
        qty: Number(it.qty) || 1,
        unitPrice: Number(it.unitPrice) || 0,
      }))
    : [];
  if (items.length === 0) {
    res.status(400).json({ error: "at least one item is required" });
    return;
  }

  const discountBody = req.body?.discount;
  let discountType: "percent" | "flat" | null = null;
  let discountValue = 0;
  let discountAmount = 0;
  let authorizedByName: string | null = null;
  let authorizedById: string | null = null;

  if (discountBody && Number(discountBody.value) > 0) {
    const type = discountBody.type === "flat" ? "flat" : "percent";
    const value = Number(discountBody.value) || 0;
    const employeeName = String(discountBody.authorizedByName ?? "").trim();
    const employeeId = String(discountBody.authorizedById ?? "").trim();
    if (!employeeName || !employeeId) {
      res.status(400).json({
        error: "Applying a discount requires the authorizing employee's name and ID",
      });
      return;
    }
    discountType = type;
    discountValue = type === "percent" ? Math.min(100, value) : value;
    authorizedByName = employeeName;
    authorizedById = employeeId;
  }

  const profile = await upsertProfile(tenant.id, phone, {
    ...(name ? { name } : {}),
    ...(businessUnitId ? { businessUnitId } : {}),
  });
  const menuItems = await listMenuItems(tenant.id);
  let lineItems = computeInvoiceLines(items, tenant, menuItemsByName(menuItems));

  if (discountType) {
    const discounted = applyInvoiceDiscount(lineItems, { type: discountType, value: discountValue });
    lineItems = discounted.lines;
    discountAmount = discounted.discountAmount;
  }

  // Same path as CSV/QR/Counter purchases: this is what feeds segments, LTV,
  // and loyalty points — a bill generated here must count as a real purchase.
  const taxableAmount = lineItems.reduce((sum, l) => sum + l.taxableValue, 0);
  await ingestNormalizedEvents(tenant, [
    {
      tenantId: tenant.id,
      phone,
      traits: name ? { name } : {},
      locationId: businessUnitId ?? undefined,
      eventType: "purchase",
      items,
      amount: taxableAmount,
      ts: new Date(),
    },
  ]);

  const invoice = await createInvoice({
    tenantId: tenant.id,
    token: generateInvoiceToken(),
    invoicePrefix: billing.invoicePrefix || tenant.config.slug.toUpperCase(),
    profileId: profile.id,
    customerName: name || profile.traits.name || null,
    customerPhone: phone,
    businessUnitId,
    lineItems,
    discountType,
    discountValue,
    discountAmount,
    authorizedByName,
    authorizedById,
  });

  const view = invoiceView(req, invoice);
  const delivery = { whatsapp: "skipped" as string, email: "skipped" as string };

  const waResult = await sendTransactionalWhatsApp(
    tenant,
    profile,
    "invoice",
    `🧾 Invoice ${invoice.invoiceNumber} from *${tenant.config.branding.shopName}* — ₹${Math.round(invoice.totalAmount)}\n${view.printUrl}`
  );
  delivery.whatsapp = waResult.status;

  if (typeof profile.traits.email === "string") {
    const emailResult = await sendInvoiceEmail(tenant, profile, invoice, view.printUrl);
    delivery.email = emailResult.status;
  }

  res.json({ invoice: view, delivery });
});

billingRouter.get("/invoices", async (req, res) => {
  const invoices = await listInvoices(req.tenant!.id, 50);
  res.json({ invoices: invoices.map((inv) => invoiceView(req, inv)) });
});

// ---------- public printable invoice (no auth: the unguessable token IS
// the credential, same pattern as the QR claim page) ----------

export const invoicesPublicRouter: import("express").Router = Router();

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function invoiceHtml(tenant: Tenant, invoice: Invoice, printUrl: string): string {
  const billing = billingProfileConfig(tenant.config);
  const shop = escapeHtml(tenant.config.branding.shopName);
  const legalName = escapeHtml(billing.legalName ?? shop);
  const address = (billing.addressLines ?? []).map(escapeHtml).join(", ");
  const rows = invoice.lineItems
    .map(
      (l) => `<tr>
        <td>${escapeHtml(l.name)}</td>
        <td>${escapeHtml(l.hsnCode)}</td>
        <td class="num">${l.qty}</td>
        <td class="num">₹${l.unitPrice.toFixed(2)}</td>
        <td class="num">${l.gstRate}%</td>
        <td class="num">₹${l.taxableValue.toFixed(2)}</td>
        <td class="num">₹${(l.cgst + l.sgst).toFixed(2)}</td>
        <td class="num">₹${l.lineTotal.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Invoice ${escapeHtml(invoice.invoiceNumber)} — ${shop}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:720px;margin:30px auto;padding:0 20px;color:#2a2420}
h1{font-size:1.3rem;margin-bottom:0}
.muted{color:#8a8178;font-size:0.9rem}
table{width:100%;border-collapse:collapse;margin-top:20px;font-size:0.9rem}
th,td{padding:8px;border-bottom:1px solid #eee}
th{text-align:left;background:#faf7f2}
.num{text-align:right}
.totals{margin-top:14px;text-align:right}
.totals div{margin:4px 0}
.grand{font-size:1.2rem;font-weight:700}
@media print{button{display:none}}
</style></head><body>
<h1>${legalName}</h1>
<div class="muted">${address}${billing.state ? ` — ${escapeHtml(billing.state)}` : ""}</div>
<div class="muted">${billing.gstin ? `GSTIN: ${escapeHtml(billing.gstin)}` : ""}${billing.pan ? ` — PAN: ${escapeHtml(billing.pan)}` : ""}</div>
<hr>
<div style="display:flex;justify-content:space-between;margin-top:14px">
  <div>
    <div><strong>Invoice ${escapeHtml(invoice.invoiceNumber)}</strong></div>
    <div class="muted">${new Date(invoice.createdAt).toLocaleDateString("en-IN")}</div>
  </div>
  <div style="text-align:right">
    <div class="muted">Bill to</div>
    <div>${escapeHtml(invoice.customerName ?? "Customer")}</div>
    <div class="muted">${escapeHtml(invoice.customerPhone ?? "")}</div>
  </div>
</div>
<table>
  <thead><tr><th>Item</th><th>HSN</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">GST</th><th class="num">Taxable</th><th class="num">Tax</th><th class="num">Total</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="totals">
  ${invoice.discountAmount > 0 ? `<div>Discount (${invoice.discountType === "percent" ? `${invoice.discountValue}%` : `flat ₹${invoice.discountValue.toFixed(2)}`}): −₹${invoice.discountAmount.toFixed(2)}</div>` : ""}
  <div>Taxable amount: ₹${invoice.taxableAmount.toFixed(2)}</div>
  <div>CGST: ₹${invoice.cgstAmount.toFixed(2)} &nbsp; SGST: ₹${invoice.sgstAmount.toFixed(2)}</div>
  <div class="grand">Total: ₹${invoice.totalAmount.toFixed(2)}</div>
</div>
${
  invoice.authorizedByName
    ? `<div class="muted" style="margin-top:8px;font-size:0.85rem">Discount authorized by: ${escapeHtml(invoice.authorizedByName)} (ID: ${escapeHtml(invoice.authorizedById ?? "")})</div>`
    : ""
}
<p class="muted" style="margin-top:30px;font-size:0.8rem">This is a GST tax invoice generated for intra-state supply. ${printUrl}</p>
<button onclick="window.print()" style="padding:10px 16px;border-radius:8px;border:none;background:#2a2420;color:#fff;cursor:pointer">Print</button>
</body></html>`;
}

invoicesPublicRouter.get("/:token", async (req, res) => {
  const invoice = await getInvoiceByToken(String(req.params.token).toUpperCase());
  const tenant = invoice && (await getTenantById(invoice.tenantId));
  if (!invoice || !tenant) {
    res.status(404).send("This invoice link is not valid.");
    return;
  }
  res.type("html").send(invoiceHtml(tenant, invoice, `${publicBaseUrl(req)}/i/${invoice.token}`));
});
