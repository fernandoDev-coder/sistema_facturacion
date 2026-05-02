import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/button-styles";
import { InvoiceLogo } from "@/components/invoice-logo";
import { PrintButton } from "@/components/print-button";
import { formatDate, money } from "@/lib/format";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", id).eq("owner_id", user.id).single();

  if (!invoice) notFound();

  const [{ data: community }, { data: company }] = await Promise.all([
    supabase
      .from("communities")
      .select("*")
      .eq("id", invoice.community_id)
      .eq("owner_id", user.id)
      .single(),
    supabase.from("company_settings").select("*").eq("owner_id", user.id).maybeSingle(),
  ]);
  const customer = {
    name: invoice.community_name ?? community?.name,
    taxId: invoice.community_tax_id ?? community?.tax_id,
    address: invoice.community_address ?? community?.address,
    postalCode: invoice.community_postal_code ?? community?.postal_code,
    city: invoice.community_city ?? community?.city,
    province: invoice.community_province ?? community?.province,
    email: invoice.community_email ?? community?.email,
    phone: invoice.community_phone ?? community?.phone,
  };

  return (
    <div className="space-y-4 print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/invoices" className={buttonClass({ variant: "ghost", size: "sm" })}>
          Volver
        </Link>
        <PrintButton />
      </div>

      <article className="print-page mx-auto min-h-[297mm] max-w-[210mm] bg-white p-10 text-zinc-950 shadow-sm ring-1 ring-zinc-200 print:p-0 print:shadow-none print:ring-0">
        <header className="flex items-start justify-between gap-10 border-b border-zinc-300 pb-8">
          <div>
            <InvoiceLogo />
            <h1 className="text-2xl font-semibold">{company?.fiscal_name ?? "Configura los datos de tu empresa"}</h1>
            <div className="mt-3 space-y-1 text-sm text-zinc-700">
              <p>{company?.tax_id}</p>
              <p>{company?.address}</p>
              <p>
                {[company?.postal_code, company?.city, company?.province].filter(Boolean).join(" ")}
              </p>
              <p>{company?.email}</p>
              <p>{company?.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm uppercase tracking-wide text-zinc-500">Factura</p>
            <p className="mt-1 text-xl font-semibold">{invoice.invoice_number}</p>
            <p className="mt-2 text-sm text-zinc-700">Fecha: {formatDate(invoice.invoice_date)}</p>
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
                Periodo: {String(invoice.month).padStart(2, "0")}/{invoice.year}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-300 text-left">
                <th className="py-3 font-semibold">Concepto</th>
                <th className="py-3 text-right font-semibold">Base imponible</th>
                <th className="py-3 text-right font-semibold">IVA</th>
                <th className="py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-4 pr-6">{invoice.subject}</td>
                <td className="py-4 text-right">{money(invoice.amount)}</td>
                <td className="py-4 text-right">
                  {invoice.vat_rate}% ({money(invoice.vat_amount)})
                </td>
                <td className="py-4 text-right font-semibold">{money(invoice.total)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mt-8 flex justify-end">
          <div className="w-full max-w-xs space-y-3 text-sm">
            <SummaryRow label="Base imponible" value={money(invoice.amount)} />
            <SummaryRow label={`IVA ${invoice.vat_rate}%`} value={money(invoice.vat_amount)} />
            <div className="flex justify-between border-t border-zinc-300 pt-3 text-lg font-semibold">
              <span>Total</span>
              <span>{money(invoice.total)}</span>
            </div>
          </div>
        </section>

        {invoice.notes ? (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Observaciones</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">{invoice.notes}</p>
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
