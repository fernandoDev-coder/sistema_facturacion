import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClass } from "@/components/button-styles";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LegalFooter } from "@/components/legal-footer";
import { PricingCard } from "@/components/pricing-card";
import { betaAccessHref } from "@/lib/beta-config";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function PricingPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const languageLabels = { language: t.common.language, es: t.common.spanish, en: t.common.english };
  const plans = [
    {
      name: "Gratis",
      price: "0 EUR",
      cadence: t.pricing.freeCadence,
      description: t.pricing.freeDescription,
      features: [
        t.pricing.features.fiveClients,
        t.pricing.features.twentyDocuments,
        t.pricing.features.invoicesBudgets,
        t.pricing.features.printA4,
      ],
      notIncluded: [
        t.pricing.features.bulkMonthly,
        t.pricing.features.companyLogo,
      ],
      cta: t.common.createFreeAccount,
      href: "/register",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "7,90 EUR",
      cadence: t.pricing.proCadence,
      description: t.pricing.proDescription,
      features: [
        t.pricing.features.thirtyClients,
        t.pricing.features.oneHundredDocuments,
        t.pricing.features.companyLogo,
        t.pricing.features.savedCompanyData,
        t.pricing.features.duplicateDocuments,
        t.pricing.features.basicTemplates,
        t.pricing.features.basicCsvExport,
        t.pricing.features.invoicesBudgets,
      ],
      notIncluded: [t.pricing.features.bulkMonthly, t.pricing.features.unlimitedClients],
      cta: t.pricing.choosePro,
      href: betaAccessHref,
      highlighted: true,
    },
    {
      name: "Premium",
      price: "14,90 EUR",
      cadence: t.pricing.proCadence,
      description: t.pricing.premiumDescription,
      features: [
        t.pricing.features.unlimitedClients,
        t.pricing.features.unlimitedDocuments,
        t.pricing.features.companyLogo,
        t.pricing.features.bulkMonthly,
        t.pricing.features.recurringPlans,
        t.pricing.features.advancedExports,
        t.pricing.features.prioritySupport,
        t.pricing.features.futureAutomations,
      ],
      notIncluded: [],
      cta: t.pricing.choosePremium,
      href: betaAccessHref,
      highlighted: false,
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <BrandLogo href="/" />
          <nav className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <LanguageSwitcher locale={locale} labels={languageLabels} />
            <Link href="/login" className={buttonClass({ variant: "ghost", size: "sm" })}>
              {t.common.login}
            </Link>
            <Link href="/register" className={buttonClass({ variant: "primary", size: "sm" })}>
              {t.common.register}
            </Link>
          </nav>
        </header>

        <section className="py-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{t.pricing.eyebrow}</p>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
            {t.pricing.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600">{t.pricing.description}</p>
          <div className="mt-5 max-w-2xl rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950">
            <p>{t.pricing.betaNotice}</p>
            <p className="mt-1 font-semibold">{t.pricing.betaNoCharges}</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              name={plan.name}
              price={plan.price}
              cadence={plan.cadence}
              description={plan.description}
              features={plan.features}
              notIncluded={plan.notIncluded}
              notIncludedLabel={t.pricing.notIncluded}
              cta={plan.cta}
              href={plan.href}
              highlighted={plan.highlighted}
              recommendedLabel={t.common.recommended}
            />
          ))}
        </section>

        <section className="mt-10 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="font-semibold">{t.pricing.comparison}</h2>
          </div>
          <div className="hidden overflow-x-auto sm:block">
            <div className="min-w-[680px] divide-y divide-zinc-100">
              <div className="grid grid-cols-4 gap-3 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-900">
                <p>{t.pricing.featureColumn}</p>
                <p>Gratis</p>
                <p>Pro</p>
                <p>Premium</p>
              </div>
              {t.pricing.comparisonRows.map(([label, free, pro, premium]) => (
                <div key={label} className="grid grid-cols-4 gap-3 px-5 py-4 text-sm">
                  <p className="font-medium text-zinc-950">{label}</p>
                  <PlanValue value={free} />
                  <PlanValue value={pro} strong />
                  <PlanValue value={premium} strong />
                </div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-zinc-100 sm:hidden">
            {t.pricing.comparisonRows.map(([label, free, pro, premium]) => (
              <div key={label} className="px-5 py-4 text-sm">
                <p className="font-medium text-zinc-950">{label}</p>
                <div className="mt-3 grid gap-2">
                  <MobilePlanValue plan="Gratis" value={free} />
                  <MobilePlanValue plan="Pro" value={pro} />
                  <MobilePlanValue plan="Premium" value={premium} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-950">{t.pricing.securePaymentTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-blue-900">{t.pricing.securePayment}</p>
          <Link href={betaAccessHref} className={buttonClass({ variant: "primary", size: "full", className: "mt-4 sm:w-auto" })}>
            {t.pricing.choosePro}
          </Link>
        </section>
      </section>
      <LegalFooter />
    </main>
  );
}

function MobilePlanValue({ plan, value }: { plan: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md bg-zinc-50 px-3 py-2">
      <span className="font-medium text-zinc-700">{plan}</span>
      <PlanValue value={value} strong />
    </div>
  );
}

function PlanValue({ value, strong = false }: { value: string; strong?: boolean }) {
  const included = value === "Incluido" || value === "Included";
  const excluded = value === "No incluido" || value === "Not included";

  return (
    <p
      className={`${
        included
          ? "font-medium text-emerald-700"
          : excluded
            ? "font-medium text-red-700"
            : strong
              ? "font-medium text-zinc-900"
              : "text-zinc-600"
      }`}
    >
      {value}
    </p>
  );
}
