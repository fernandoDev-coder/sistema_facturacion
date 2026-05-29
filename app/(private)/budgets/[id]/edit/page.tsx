import Link from "next/link";
import { notFound } from "next/navigation";
import { updateBudgetAction } from "@/app/actions/invoices";
import { buttonClass } from "@/components/button-styles";
import { InvoiceForm } from "@/components/invoice-form";
import { Message } from "@/components/message";
import { getDictionary, getLocale } from "@/lib/i18n";
import { fallbackInvoiceItems } from "@/lib/invoice-items";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function EditBudgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { message } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();
  const [{ data: budget }, { data: communities }, { data: items }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).eq("owner_id", user.id).eq("document_type", "budget").single(),
    supabase.from("communities").select("*").eq("owner_id", user.id).order("name"),
    supabase.from("invoice_items").select("*").eq("owner_id", user.id).eq("invoice_id", id).order("sort_order"),
  ]);

  if (!budget) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/budgets" className={buttonClass({ variant: "ghost", size: "sm" })}>
          {t.common.back}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.pages.budgets.editTitle}</h1>
      </div>
      <Message text={message} />
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <InvoiceForm
          action={updateBudgetAction}
          communities={communities ?? []}
          documentType="budget"
          invoice={budget}
          items={items?.length ? items : fallbackInvoiceItems(budget)}
          labels={t.forms.document}
          months={t.months}
          statusLabels={t.statuses}
        />
      </section>
    </div>
  );
}
