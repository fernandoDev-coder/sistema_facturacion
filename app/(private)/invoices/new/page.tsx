import Link from "next/link";
import { createInvoiceAction } from "@/app/actions/invoices";
import { buttonClass } from "@/components/button-styles";
import { InvoiceForm } from "@/components/invoice-form";
import { Message } from "@/components/message";
import { currentMonthYear } from "@/lib/format";
import { suggestInvoiceNumber } from "@/lib/invoices";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const { message } = await searchParams;
  const supabase = await createClient();
  const { year } = currentMonthYear();
  const [{ data: communities }, suggestedNumber] = await Promise.all([
    supabase.from("communities").select("*").eq("owner_id", user.id).order("name"),
    suggestInvoiceNumber(user.id, year),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/invoices" className={buttonClass({ variant: "ghost", size: "sm" })}>
          Volver
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Nueva factura</h1>
      </div>
      <Message text={message} />
      {communities?.length ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <InvoiceForm
            action={createInvoiceAction}
            communities={communities}
            documentType="invoice"
            suggestedNumber={suggestedNumber}
          />
        </section>
      ) : (
        <div className="rounded-md border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">Primero crea un cliente para poder facturar.</p>
          <Link href="/clients/new" className={buttonClass({ variant: "primary", className: "mt-4" })}>
            Nuevo cliente
          </Link>
        </div>
      )}
    </div>
  );
}
