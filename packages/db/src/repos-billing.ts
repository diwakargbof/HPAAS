// GST invoice repo: per-tenant sequential invoice numbers (via an atomic
// counter, never a racy COUNT(*)+1) and the invoice record itself, which
// snapshots its line items/tax breakup so past invoices never change even
// if menu prices or tax rates do later.

import type { Invoice, InvoiceLineItem } from "@hpas/types";
import { query, queryOne, withTransaction } from "./client.js";

const mapInvoice = (r: any): Invoice => ({
  id: r.id,
  tenantId: r.tenant_id,
  token: r.token,
  invoiceNumber: r.invoice_number,
  profileId: r.profile_id,
  customerName: r.customer_name,
  customerPhone: r.customer_phone,
  lineItems: r.line_items ?? [],
  taxableAmount: Number(r.taxable_amount),
  cgstAmount: Number(r.cgst_amount),
  sgstAmount: Number(r.sgst_amount),
  totalAmount: Number(r.total_amount),
  discountType: r.discount_type,
  discountValue: Number(r.discount_value ?? 0),
  discountAmount: Number(r.discount_amount ?? 0),
  authorizedByName: r.authorized_by_name,
  authorizedById: r.authorized_by_id,
  status: r.status,
  createdAt: r.created_at,
});

export async function createInvoice(i: {
  tenantId: string;
  token: string;
  invoicePrefix: string;
  profileId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  lineItems: InvoiceLineItem[];
  discountType?: "percent" | "flat" | null;
  discountValue?: number;
  discountAmount?: number;
  authorizedByName?: string | null;
  authorizedById?: string | null;
}): Promise<Invoice> {
  const taxableAmount = i.lineItems.reduce((sum, l) => sum + l.taxableValue, 0);
  const cgstAmount = i.lineItems.reduce((sum, l) => sum + l.cgst, 0);
  const sgstAmount = i.lineItems.reduce((sum, l) => sum + l.sgst, 0);
  const totalAmount = i.lineItems.reduce((sum, l) => sum + l.lineTotal, 0);

  return withTransaction(async (client) => {
    // First-ever call for a tenant: the INSERT branch fires, DEFAULT 1 makes
    // this row's next_number 1 already — return it as-is. Every later call
    // hits the ON CONFLICT branch, increments first, then returns the new
    // value. Either way, `next_number` here is the number to assign now.
    const counter = await client.query<{ next_number: number }>(
      `INSERT INTO invoice_counters (tenant_id) VALUES ($1)
       ON CONFLICT (tenant_id) DO UPDATE SET next_number = invoice_counters.next_number + 1
       RETURNING next_number`,
      [i.tenantId]
    );
    const seq = counter.rows[0].next_number;
    const invoiceNumber = `${i.invoicePrefix}-${String(seq).padStart(4, "0")}`;

    const row = await client.query(
      `INSERT INTO invoices
         (tenant_id, token, invoice_number, profile_id, customer_name, customer_phone,
          line_items, taxable_amount, cgst_amount, sgst_amount, total_amount,
          discount_type, discount_value, discount_amount, authorized_by_name, authorized_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        i.tenantId,
        i.token,
        invoiceNumber,
        i.profileId ?? null,
        i.customerName ?? null,
        i.customerPhone ?? null,
        JSON.stringify(i.lineItems),
        taxableAmount,
        cgstAmount,
        sgstAmount,
        totalAmount,
        i.discountType ?? null,
        i.discountValue ?? 0,
        i.discountAmount ?? 0,
        i.authorizedByName ?? null,
        i.authorizedById ?? null,
      ]
    );
    return mapInvoice(row.rows[0]);
  });
}

/**
 * Global token lookup — tenant-unscoped, like getQrOrderByToken: the
 * unguessable token is the credential for the public printable page.
 */
export async function getInvoiceByToken(token: string): Promise<Invoice | null> {
  const row = await queryOne(`SELECT * FROM invoices WHERE token = $1`, [token]);
  return row ? mapInvoice(row) : null;
}

export async function listInvoices(tenantId: string, limit = 50): Promise<Invoice[]> {
  const rows = await query(
    `SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [tenantId, limit]
  );
  return rows.map(mapInvoice);
}
