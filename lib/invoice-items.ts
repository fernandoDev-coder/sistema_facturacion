import type { Invoice, InvoiceItem } from "@/lib/types";

export function fallbackInvoiceItems(invoice: Pick<Invoice, "id" | "owner_id" | "subject" | "amount" | "vat_rate" | "vat_amount" | "total">): InvoiceItem[] {
  return [
    {
      id: `${invoice.id}-fallback`,
      owner_id: invoice.owner_id,
      invoice_id: invoice.id,
      description: invoice.subject,
      amount: invoice.amount,
      vat_rate: invoice.vat_rate,
      vat_amount: invoice.vat_amount,
      total: invoice.total,
      sort_order: 0,
      created_at: new Date(0).toISOString(),
    },
  ];
}
