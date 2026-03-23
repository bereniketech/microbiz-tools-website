import { z } from "zod";

export const invoiceLineItemSchema = z.object({
  name: z.string().trim().min(1, "Line item name is required"),
  qty: z.preprocess(
    (value) => {
      if (value === "" || value === undefined || value === null) return value;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    },
    z.number().positive("Quantity must be greater than 0"),
  ),
  unit_price: z.preprocess(
    (value) => {
      if (value === "" || value === undefined || value === null) return value;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    },
    z.number().nonnegative("Unit price must be zero or greater"),
  ),
});

export const createInvoiceSchema = z.object({
  client_id: z.string().uuid("Client is required"),
  proposal_id: z.string().uuid().optional().nullable(),
  invoice_number: z.string().trim().min(1, "Invoice number is required"),
  currency: z.string().trim().min(1, "Currency is required").default("USD"),
  due_date: z.string().datetime({ offset: true }).nullable().optional(),
  tax_rate: z.preprocess(
    (value) => {
      if (value === "" || value === undefined || value === null) return 0;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    },
    z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100"),
  ),
  line_items: z.array(invoiceLineItemSchema).min(1, "At least one line item is required"),
});

export const updateInvoiceSchema = z
  .object({
    status: z.enum(["pending", "paid", "overdue"]).optional(),
    due_date: z.string().datetime({ offset: true }).nullable().optional(),
    tax_rate: z.preprocess(
      (value) => {
        if (value === "" || value === undefined || value === null) return undefined;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : value;
      },
      z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100").optional(),
    ),
    line_items: z.array(invoiceLineItemSchema).min(1).optional(),
    currency: z.string().trim().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
    path: ["body"],
  });

export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;

export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateInvoiceTotals(lineItems: InvoiceLineItemInput[], taxRate: number): InvoiceTotals {
  const subtotal = roundCurrency(lineItems.reduce((sum, item) => sum + Number(item.qty) * Number(item.unit_price), 0));
  const taxAmount = roundCurrency((subtotal * taxRate) / 100);
  const totalAmount = roundCurrency(subtotal + taxAmount);

  return { subtotal, taxAmount, totalAmount };
}
