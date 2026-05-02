import Link from "next/link";
import { buttonClass } from "@/components/button-styles";
import { InvoiceLogo } from "@/components/invoice-logo";
import { PrintButton } from "@/components/print-button";
import { formatLongDate, money } from "@/lib/format";
import type { CompanySettings, Invoice, InvoiceItem } from "@/lib/types";

type CustomerSnapshot = {
  name?: string | null;
  taxId?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
  email?: string | null;
  phone?: string | null;
};

export function DocumentPrint({
  document,
  items,
  company,
  customer,
  title,
  backHref,
}: {
  document: Invoice;
  items: InvoiceItem[];
  company: CompanySettings | null;
  customer: CustomerSnapshot;
  title: string;
  backHref: string;
}) {
  return (
    <div className="space-y-4 print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href={backHref} className={buttonClass({ variant: "ghost", size: "sm" })}>
          Volver
        </Link>
        <PrintButton />
      </div>

      <article className="print-page mx-auto min-h-[297mm] max-w-[210mm] bg-white p-10 text-zinc-950 shadow-sm ring-1 ring-zinc-200 print:p-0 print:shadow-none print:ring-0">
        <header className="flex items-start justify-between gap-10 border-b border-zinc-300 pb-8">
          <div className="min-w-0 flex-1">
            <InvoiceLogo />
            <h1 className="text-2xl font-semibold">{company?.fiscal_name ?? "Configura los datos de tu empresa"}</h1>
            <div className="mt-3 space-y-1 text-sm text-zinc-700">
              <p>{company?.tax_id}</p>
              <p>{company?.address}</p>
              <p>{[company?.postal_code, company?.city, company?.province].filter(Boolean).join(" ")}</p>
              <p>{company?.email}</p>
              <p>{company?.phone}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm uppercase tracking-wide text-zinc-500">{title}</p>
            <p className="mt-1 text-xl font-semibold">{document.invoice_number}</p>
            <p className="mt-2 text-sm text-zinc-700">Fecha: {formatLongDate(document.invoice_date)}</p>
          </div>
        </header>

        <section className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Cliente</h2>
            <div className="mt-3 space-y-1 text-sm">
              <p className="text-base font-semibold">{customer.name}</p>
              <p>{customer.taxId}</p>
              <p>{customer.address}</p>
              <p>{[customer.postalCode, customer.city, customer.province].filter(Boolean).join(" ")}</p>
              <p>{customer.email}</p>
              <p>{customer.phone}</p>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Datos de pago</h2>
            <div className="mt-3 space-y-1 text-sm">
              <p>IBAN: {company?.iban ?? "-"}</p>
              <p>
                Periodo: {String(document.month).padStart(2, "0")}/{document.year}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[46%]" />
              <col className="w-[16%]" />
              <col className="w-[18%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-zinc-300 text-left">
                <th className="py-3 pr-6 font-semibold">Concepto</th>
                <th className="py-3 text-right font-semibold">Base</th>
                <th className="py-3 text-right font-semibold">IVA</th>
                <th className="py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-200 align-top">
                  <td className="whitespace-pre-line break-words py-4 pr-6 leading-6">{item.description}</td>
                  <td className="py-4 text-right">{money(item.amount)}</td>
                  <td className="py-4 text-right">
                    {item.vat_rate}% ({money(item.vat_amount)})
                  </td>
                  <td className="py-4 text-right font-semibold">{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8 flex justify-end">
          <div className="w-full max-w-xs space-y-3 text-sm">
            <SummaryRow label="Base imponible" value={money(document.amount)} />
            <SummaryRow label="IVA total" value={money(document.vat_amount)} />
            <div className="flex justify-between border-t border-zinc-300 pt-3 text-lg font-semibold">
              <span>Total</span>
              <span>{money(document.total)}</span>
            </div>
          </div>
        </section>

        {document.notes ? (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Observaciones</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">{document.notes}</p>
          </section>
        ) : null}

        {company?.invoice_footer ? (
          <footer className="mt-16 border-t border-zinc-200 pt-5 text-xs leading-5 text-zinc-600">
            {company.invoice_footer}
          </footer>
        ) : null}
      </article>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
