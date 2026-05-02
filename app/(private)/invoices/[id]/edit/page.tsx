import Link from "next/link";
import { notFound } from "next/navigation";
import { updateInvoiceAction } from "@/app/actions/invoices";
import { buttonClass } from "@/components/button-styles";
import { InvoiceForm } from "@/components/invoice-form";
import { Message } from "@/components/message";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function EditInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { message } = await searchParams;
  const supabase = await createClient();
  const [{ data: invoice }, { data: communities }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).eq("owner_id", user.id).single(),
    supabase.from("communities").select("*").eq("owner_id", user.id).order("name"),
  ]);

  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/invoices" className={buttonClass({ variant: "ghost", size: "sm" })}>
          Volver
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Editar factura</h1>
      </div>
      <Message text={message} />
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <InvoiceForm action={updateInvoiceAction} communities={communities ?? []} invoice={invoice} />
      </section>
    </div>
  );
}
