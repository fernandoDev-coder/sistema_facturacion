import Link from "next/link";
import { completeOnboardingAction } from "@/app/actions/auth";
import { buttonClass } from "@/components/button-styles";
import { FormButton } from "@/components/form-button";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getCompanySetupStatus } from "@/lib/onboarding";
import { getPlanLimits } from "@/lib/plan-limits";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function WelcomePage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const [{ count: communities }, { count: invoices }, { data: company }, { data: latestInvoice }] = await Promise.all([
    supabase.from("communities").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("document_type", "invoice"),
    supabase.from("company_settings").select("*").eq("owner_id", user.id).maybeSingle(),
    supabase
      .from("invoices")
      .select("id")
      .eq("owner_id", user.id)
      .eq("document_type", "invoice")
      .order("invoice_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const limits = getPlanLimits(profile);
  const companyStatus = getCompanySetupStatus(company, { requireLogo: limits.companyLogo });
  const hasClient = (communities ?? 0) > 0;
  const hasInvoice = (invoices ?? 0) > 0;

  const checklist = [
    {
      title: t.pages.welcome.companyTitle,
      description: companyStatus.completed
        ? t.pages.welcome.companyReady
        : `${t.pages.welcome.missing} ${companyStatus.missingFields.map((field) => field.label).join(", ")}.`,
      href: "/settings/company",
      done: companyStatus.completed,
      cta: t.pages.welcome.companyCta,
    },
    {
      title: t.pages.welcome.clientTitle,
      description: t.pages.welcome.clientDescription,
      href: "/clients/new",
      done: hasClient,
      cta: t.pages.welcome.clientCta,
    },
    {
      title: t.pages.welcome.invoiceTitle,
      description: t.pages.welcome.invoiceDescription,
      href: hasClient ? "/invoices/new" : "/clients/new",
      done: hasInvoice,
      cta: hasClient ? t.pages.welcome.invoiceCta : t.pages.welcome.invoiceNeedsClient,
    },
    {
      title: t.pages.welcome.printTitle,
      description: t.pages.welcome.printDescription,
      href: latestInvoice?.id ? `/invoices/${latestInvoice.id}/print` : "/invoices",
      done: hasInvoice,
      cta: latestInvoice?.id ? t.pages.welcome.printCta : t.pages.welcome.viewInvoices,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">{t.pages.welcome.eyebrow}</p>
        <h1 className="mt-3 text-2xl font-semibold text-zinc-950 sm:text-3xl">{t.pages.welcome.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          {profile?.is_super_admin ? t.pages.welcome.adminDescription : t.pages.welcome.description}
        </p>
        <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
          <Link href="/dashboard" className={buttonClass({ variant: "secondary", size: "full", className: "sm:w-auto" })}>
            {t.pages.welcome.dashboard}
          </Link>
          <form action={completeOnboardingAction} className="sm:inline">
            <FormButton pendingText={t.common.saving} variant="primary" className="w-full sm:w-auto">
              {t.pages.welcome.complete}
            </FormButton>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {checklist.map((item) => (
          <article key={item.title} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {item.done ? t.pages.welcome.done : t.pages.welcome.pending}
            </p>
            <h2 className="mt-3 text-lg font-semibold text-zinc-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
            <Link
              href={item.href}
              className={buttonClass({ variant: item.done ? "secondary" : "primary", className: "mt-5 w-full" })}
            >
              {item.cta}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
