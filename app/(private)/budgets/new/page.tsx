import Link from "next/link";
import { createBudgetAction } from "@/app/actions/invoices";
import { buttonClass } from "@/components/button-styles";
import { InvoiceForm } from "@/components/invoice-form";
import { Message } from "@/components/message";
import { currentMonthYear } from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/i18n";
import { suggestDocumentNumber } from "@/lib/invoices";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function NewBudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const { message } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();
  const { year } = currentMonthYear();
  const [{ data: communities }, suggestedNumber] = await Promise.all([
    supabase.from("communities").select("*").eq("owner_id", user.id).order("name"),
    suggestDocumentNumber(user.id, year, "budget"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/budgets" className={buttonClass({ variant: "ghost", size: "sm" })}>
          {t.common.back}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.pages.budgets.newTitle}</h1>
      </div>
      <Message text={message} />
      {communities?.length ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <InvoiceForm
            action={createBudgetAction}
            communities={communities}
            documentType="budget"
            suggestedNumber={suggestedNumber}
            labels={t.forms.document}
            months={t.months}
            statusLabels={t.statuses}
          />
        </section>
      ) : (
        <div className="rounded-md border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">{t.pages.budgets.noClient}</p>
          <Link href="/clients/new" className={buttonClass({ variant: "primary", className: "mt-4" })}>
            {t.pages.budgets.newClient}
          </Link>
        </div>
      )}
    </div>
  );
}
