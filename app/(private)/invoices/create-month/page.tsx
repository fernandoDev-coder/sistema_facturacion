import Link from "next/link";
import { buttonClass } from "@/components/button-styles";
import { CreateMonthForm } from "@/components/create-month-form";
import { Message } from "@/components/message";
import { currentMonthYear } from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getPlanLimits } from "@/lib/plan-limits";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function CreateMonthPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; message?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const fallback = currentMonthYear();
  const month = Number(params.month ?? fallback.month);
  const year = Number(params.year ?? fallback.year);
  const profile = await getCurrentProfile();
  const limits = getPlanLimits(profile);
  const supabase = await createClient();

  const [{ data: communities }, { data: existingInvoices }] = await Promise.all([
    supabase.from("communities").select("*").eq("owner_id", user.id).order("name"),
    supabase.from("invoices").select("community_id,month,year").eq("owner_id", user.id).eq("document_type", "invoice"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/invoices" className={buttonClass({ variant: "ghost", size: "sm" })}>
          {t.common.back}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.pages.monthly.title}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t.pages.monthly.description}</p>
      </div>
      <Message text={params.message} />
      {!limits.monthlyBulkInvoices ? (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="font-semibold text-blue-950">{t.pages.monthly.proTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-blue-900">
            {t.pages.monthly.proDescription}
          </p>
          <Link href="/settings/billing" className={buttonClass({ variant: "primary", className: "mt-4" })}>
            {t.pages.monthly.viewPro}
          </Link>
        </section>
      ) : communities?.length ? (
        <CreateMonthForm
          communities={communities}
          existingInvoices={existingInvoices ?? []}
          initialMonth={month}
          initialYear={year}
          labels={t.forms.monthly}
          months={t.months}
          monthLabel={t.common.month}
          yearLabel={t.common.year}
        />
      ) : (
        <div className="rounded-md border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">{t.pages.monthly.noClients}</p>
          <Link href="/clients/new" className={buttonClass({ variant: "primary", className: "mt-4" })}>
            {t.pages.monthly.newClient}
          </Link>
        </div>
      )}
    </div>
  );
}
