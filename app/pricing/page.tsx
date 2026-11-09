import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClass } from "@/components/button-styles";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LegalFooter } from "@/components/legal-footer";
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

        <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white" tabIndex={0} aria-label={t.pricing.comparison}>
          <table className="min-w-[680px] w-full text-left text-sm">
            <caption className="p-5 text-left font-semibold">{t.pricing.comparison}</caption>
            <thead className="bg-zinc-50">
              <tr>
                <th scope="col" className="p-4">{t.pricing.featureColumn}</th>
                {plans.map((plan) => <th scope="col" className="p-4" key={plan.name}>
                  <p className="text-lg">{plan.name === "Gratis" && locale === "en" ? "Free" : plan.name}</p>
                  <p className="mt-2">{plan.price}</p>
                  <p className="font-normal text-zinc-600">{plan.cadence}</p>
                </th>)}
              </tr>
            </thead>
            <tbody>
              {t.pricing.comparisonRows.map(([label, ...values]) => <tr key={label} className="border-t border-zinc-200">
                <th scope="row" className="p-4 font-medium">{label}</th>
                {values.map((value, index) => <td className="p-4" key={index}>{value}</td>)}
              </tr>)}
              <tr className="border-t border-zinc-200">
                <th scope="row" className="p-4">{locale === "es" ? "Acceso durante la beta" : "Access during beta"}</th>
                {plans.map((plan) => <td key={plan.name} className="p-4">
                  <Link href={plan.href} className={buttonClass({ variant: "secondary" })}>{plan.cta}</Link>
                </td>)}
              </tr>
            </tbody>
          </table>
        </section>
        <p className="mt-4 text-sm text-zinc-600">{locale === "es" ? "El alta gratuita comienza en el registro. Si se solicita confirmaci\u00f3n, revisa tu correo antes de iniciar sesi\u00f3n. Para Pro y Premium, prepara una solicitud de acceso por email." : "Free access starts with registration. If confirmation is requested, check your email before signing in. For Pro and Premium, prepare an access request by email."}</p>
      </section>
      <LegalFooter />
    </main>
  );
}
