import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClass, type ButtonVariant } from "@/components/button-styles";
import { money } from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getCompanySetupStatus } from "@/lib/onboarding";
import {
  getClientCount,
  getCurrentMonthDocumentCount,
  getPlanLimits,
  hasPaidAccess,
} from "@/lib/plan-limits";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { InvoiceWithCommunity } from "@/lib/types";

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const locale = await getLocale();
  const t = getDictionary(locale);

  if (profile && !profile.onboarding_completed_at) {
    redirect("/welcome");
  }

  const supabase = await createClient();
  const limits = getPlanLimits(profile);
  const isPro = hasPaidAccess(profile);

  const [
    clients,
    documentsThisMonth,
    { count: invoices },
    { count: pending },
    { count: budgets },
    { data: recentInvoices },
    { data: recentBudgets },
    { data: company },
  ] = await Promise.all([
    getClientCount(supabase, user.id),
    getCurrentMonthDocumentCount(supabase, user.id),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("document_type", "invoice"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("document_type", "invoice")
      .eq("status", "pending"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("document_type", "budget"),
    supabase
      .from("invoices")
      .select("*, communities(id,name,tax_id,city)")
      .eq("owner_id", user.id)
      .eq("document_type", "invoice")
      .order("invoice_date", { ascending: false })
      .order("invoice_number", { ascending: false })
      .limit(5),
    supabase
      .from("invoices")
      .select("*, communities(id,name,tax_id,city)")
      .eq("owner_id", user.id)
      .eq("document_type", "budget")
      .order("invoice_date", { ascending: false })
      .order("invoice_number", { ascending: false })
      .limit(5),
    supabase.from("company_settings").select("*").eq("owner_id", user.id).maybeSingle(),
  ]);

  const companyStatus = getCompanySetupStatus(company, { requireLogo: limits.companyLogo });
  const invoicesList = (recentInvoices ?? []) as InvoiceWithCommunity[];
  const budgetsList = (recentBudgets ?? []) as InvoiceWithCommunity[];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">{t.pages.dashboard.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t.pages.dashboard.description}</p>
        </div>
        {!isPro ? (
          <Link href="/settings/billing" className={buttonClass({ variant: "primary", size: "full", className: "sm:w-auto" })}>
            {t.common.upgradeToPro}
          </Link>
        ) : null}
      </div>

      {!companyStatus.completed ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-amber-950">{t.pages.dashboard.completeCompanyTitle}</h2>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                {t.pages.dashboard.completeCompanyPrefix} {companyStatus.missingFields.map((field) => field.label).join(", ")}.{" "}
                {t.pages.dashboard.completeCompanySuffix}
              </p>
            </div>
            <Link href="/settings/company" className={buttonClass({ variant: "warning", size: "full", className: "sm:w-auto" })}>
              {t.pages.dashboard.completeCompanyCta}
            </Link>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={t.common.clients}
          value={limits.clients === null ? String(clients) : `${clients} / ${limits.clients}`}
          hint={limits.clients === null ? t.common.noLimitPro : t.common.freePlan}
          warn={limits.clients !== null && clients >= limits.clients}
        />
        <Metric
          label={t.pages.dashboard.documentsThisMonth}
          value={limits.documentsPerMonth === null ? String(documentsThisMonth) : `${documentsThisMonth} / ${limits.documentsPerMonth}`}
          hint={limits.documentsPerMonth === null ? t.common.noLimitPro : t.pages.dashboard.invoicesBudgets}
          warn={limits.documentsPerMonth !== null && documentsThisMonth >= limits.documentsPerMonth}
        />
        <Metric label={t.pages.dashboard.invoicesCreated} value={String(invoices ?? 0)} hint={`${pending ?? 0} ${t.pages.dashboard.pending}`} />
        <Metric label={t.pages.dashboard.budgetsCreated} value={String(budgets ?? 0)} hint={isPro ? t.pages.dashboard.proActive : t.common.freePlan} />
      </section>

      <section>
        <h2 className="text-lg font-semibold">{t.pages.dashboard.quickLinks}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickLink href="/invoices/new" label={t.pages.dashboard.createInvoice} variant="primary" />
          <QuickLink href="/budgets/new" label={t.pages.dashboard.createBudget} variant="warning" />
          <QuickLink href="/clients/new" label={t.pages.dashboard.createClient} variant="secondary" />
          <QuickLink href="/invoices/create-month" label={t.pages.dashboard.monthlyBilling} variant="success" />
          <QuickLink href="/settings/company" label={t.pages.dashboard.companyDetails} variant="secondary" />
          <QuickLink href="/settings/billing" label={t.pages.dashboard.viewPlanLimits} variant="secondary" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RecentDocuments
          title={t.pages.dashboard.recentInvoices}
          documents={invoicesList}
          emptyText={t.pages.dashboard.noInvoices}
          emptyHref="/invoices/new"
          emptyCta={t.pages.dashboard.firstInvoice}
          months={t.months}
          unnamedClient={t.common.unnamedClient}
        />
        <RecentDocuments
          title={t.pages.dashboard.recentBudgets}
          documents={budgetsList}
          emptyText={t.pages.dashboard.noBudgets}
          emptyHref="/budgets/new"
          emptyCta={t.pages.dashboard.firstBudget}
          months={t.months}
          unnamedClient={t.common.unnamedClient}
        />
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  warn = false,
}: {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-white p-5 shadow-sm ${warn ? "border-amber-300" : "border-zinc-200"}`}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function QuickLink({
  href,
  label,
  variant,
}: {
  href: string;
  label: string;
  variant: ButtonVariant;
}) {
  return (
    <Link href={href} className={buttonClass({ variant, size: "full", className: "justify-center shadow-sm sm:justify-start" })}>
      {label}
    </Link>
  );
}

function RecentDocuments({
  title,
  documents,
  emptyText,
  emptyHref,
  emptyCta,
  months,
  unnamedClient,
}: {
  title: string;
  documents: InvoiceWithCommunity[];
  emptyText: string;
  emptyHref: string;
  emptyCta: string;
  months: readonly string[];
  unnamedClient: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="font-semibold text-zinc-950">{title}</h2>
      </div>
      {documents.length ? (
        <div className="divide-y divide-zinc-100">
          {documents.map((document) => (
            <Link
              key={document.id}
              href={`/${document.document_type === "budget" ? "budgets" : "invoices"}/${document.id}/edit`}
              className="grid gap-1 px-5 py-4 hover:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words font-medium text-zinc-950">{document.invoice_number}</p>
                <p className="shrink-0 text-sm font-semibold text-zinc-900">{money(document.total)}</p>
              </div>
              <p className="text-sm text-zinc-600">{document.communities?.name ?? unnamedClient}</p>
              <p className="text-xs text-zinc-500">
                {months[document.month - 1]} {document.year}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-600">{emptyText}</p>
          <Link href={emptyHref} className={buttonClass({ variant: "primary", size: "full", className: "mt-4 sm:w-auto" })}>
            {emptyCta}
          </Link>
        </div>
      )}
    </section>
  );
}
