import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClass } from "@/components/button-styles";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LegalFooter } from "@/components/legal-footer";
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
        t.pricing.features.twentyFiveDocuments,
        t.pricing.features.invoicesBudgets,
        t.pricing.features.printA4,
      ],
      notIncluded: [
        t.pricing.features.bulkMonthly,
        t.pricing.features.unlimitedClients,
        t.pricing.features.unlimitedDocuments,
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
        t.pricing.features.unlimitedClients,
        t.pricing.features.unlimitedDocuments,
        t.pricing.features.bulkMonthly,
        t.pricing.features.companyLogo,
      ],
      notIncluded: [],
      cta: t.pricing.choosePro,
      href: "/register",
      highlighted: true,
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo href="/" />
          <nav className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} labels={languageLabels} />
            <Link href="/login" className={buttonClass({ variant: "ghost", size: "sm" })}>
              {t.common.login}
            </Link>
            <Link href="/register" className={buttonClass({ variant: "primary", size: "sm" })}>
              {t.common.register}
            </Link>
          </nav>
        </header>

        <section className="py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{t.pricing.eyebrow}</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
            {t.pricing.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600">{t.pricing.description}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-lg border bg-white p-6 shadow-sm ${
                plan.highlighted ? "border-blue-300 ring-2 ring-blue-100" : "border-zinc-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{plan.description}</p>
                </div>
                {plan.highlighted ? (
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                    {t.common.recommended}
                  </span>
                ) : null}
              </div>

              <div className="mt-6">
                <p className="text-3xl font-semibold">{plan.price}</p>
                <p className="mt-1 text-sm text-zinc-500">{plan.cadence}</p>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-zinc-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.notIncluded.length ? (
                <ul className="mt-4 space-y-2 text-sm text-zinc-500">
                  {plan.notIncluded.map((feature) => (
                    <li key={feature}>
                      {t.pricing.notIncluded}: {feature}
                    </li>
                  ))}
                </ul>
              ) : null}

              <Link
                href={plan.href}
                className={buttonClass({
                  variant: plan.highlighted ? "primary" : "secondary",
                  size: "full",
                  className: "mt-6",
                })}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-10 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="font-semibold">{t.pricing.comparison}</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {t.pricing.comparisonRows.map(([label, free, pro]) => (
              <div key={label} className="grid grid-cols-3 gap-3 px-5 py-4 text-sm">
                <p className="font-medium text-zinc-950">{label}</p>
                <p className="text-zinc-600">{free}</p>
                <p className="font-medium text-zinc-900">{pro}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-950">{t.pricing.securePaymentTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-blue-900">{t.pricing.securePayment}</p>
          <Link href="/register" className={buttonClass({ variant: "primary", className: "mt-4" })}>
            {t.pricing.choosePro}
          </Link>
        </section>
      </section>
      <LegalFooter />
    </main>
  );
}
