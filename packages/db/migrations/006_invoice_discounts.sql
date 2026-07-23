-- Invoice discounts: a tenant can apply a discount to a GST invoice for a
-- familiar customer or as an employee discount. Whenever a discount is
-- applied, the authorizing employee's name + ID are mandatory (compliance/
-- accountability requirement — no anonymous discounting), so both live on
-- the invoice row alongside the discount itself.

ALTER TABLE invoices ADD COLUMN discount_type TEXT CHECK (discount_type IN ('percent', 'flat'));
ALTER TABLE invoices ADD COLUMN discount_value NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN authorized_by_name TEXT;
ALTER TABLE invoices ADD COLUMN authorized_by_id TEXT;
