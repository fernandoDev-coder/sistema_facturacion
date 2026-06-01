import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClass } from "@/components/button-styles";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LegalFooter } from "@/components/legal-footer";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function HomePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const languageLabels = { language: t.common.language, es: t.common.spanish, en: t.common.english };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <BrandLogo href="/" />
          <nav className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <LanguageSwitcher locale={locale} labels={languageLabels} />
            <Link href="/pricing" className={buttonClass({ variant: "ghost", size: "sm" })}>
              {t.common.pricing}
            </Link>
            <Link href="/login" className={buttonClass({ variant: "secondary", size: "sm" })}>
              {t.common.login}
            </Link>
            <Link href="/register" className={buttonClass({ variant: "primary", size: "sm" })}>
              {t.common.register}
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 gap-8 overflow-hidden py-8 sm:py-12 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="hero-slide-in-left">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              {t.home.eyebrow}
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
              {t.home.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">
              {t.home.description}
            </p>
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/register" className={buttonClass({ variant: "primary", size: "full", className: "sm:w-auto" })}>
                {t.common.createFreeAccount}
              </Link>
              <Link href="/pricing" className={buttonClass({ variant: "secondary", size: "full", className: "sm:w-auto" })}>
                {t.common.viewPlans}
              </Link>
            </div>
          </div>

          <div className="hero-slide-in-right">
            <InvoicePreview copy={t.home} />
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold">{t.home.problemTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{t.home.problem}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {t.home.benefits.map((benefit) => (
              <div key={benefit} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">{t.home.featuresTitle}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {t.home.features.map((feature) => (
                <div key={feature} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium">
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{t.home.idealTitle}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {t.home.idealFor.map((item) => (
                <div key={item} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-3 lg:px-8">
          <PlanCard
            name="Gratis"
            price="0 EUR"
            description={t.pricing.freeDescription}
            features={[
              t.pricing.features.fiveClients,
              t.pricing.features.twentyFiveDocuments,
              t.pricing.features.invoicesBudgets,
              t.pricing.features.printA4,
            ]}
            cta={t.common.createFreeAccount}
            href="/register"
          />
          <PlanCard
            name="Pro"
            price="7,90 EUR/mes + IVA"
            description={t.pricing.proDescription}
            features={[
              t.pricing.features.fifteenClients,
              t.pricing.features.fiftyDocuments,
              t.pricing.features.companyLogo,
            ]}
            cta={t.pricing.choosePro}
            href="/pricing"
            highlighted
            recommendedLabel={t.common.recommended}
          />
          <PlanCard
            name="Premium"
            price="14,90 EUR/mes + IVA"
            description={t.pricing.premiumDescription}
            features={[
              t.pricing.features.unlimitedClients,
              t.pricing.features.unlimitedDocuments,
              t.pricing.features.companyLogo,
              t.pricing.features.bulkMonthly,
            ]}
            cta={t.pricing.choosePremium}
            href="/pricing"
          />
        </div>
      </section>
      <LegalFooter />
    </main>
  );
}

function InvoicePreview({ copy }: { copy: ReturnType<typeof getDictionary>["home"] }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="flex min-w-0 items-start gap-3">
          <Image
            src="/brand/faktuflow-mark.svg"
            alt=""
            width={44}
            height={36}
            priority
            className="h-10 w-12 shrink-0 object-contain"
            aria-hidden="true"
          />
          <div>
            <p className="text-lg font-semibold">{copy.invoicePreviewTitle}</p>
            <p className="mt-1 text-sm text-zinc-500">{copy.invoicePreviewSubtitle}</p>
          </div>
        </div>
        <div className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white">A4</div>
      </div>
      <div className="mt-6 grid gap-4 text-sm">
        <PreviewRow label={copy.customer} value={copy.customerValue} />
        <PreviewRow label={copy.concept} value={copy.conceptValue} />
        <PreviewRow label={copy.base} value="120,00 EUR" />
        <PreviewRow label={copy.vat} value="25,20 EUR" />
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 text-base font-semibold">
          <span>{copy.total}</span>
          <span>145,20 EUR</span>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-900">{value}</span>
    </div>
  );
}

function PlanCard({
  name,
  price,
  description,
  features,
  cta,
  href,
  highlighted = false,
  recommendedLabel = "Recomendado",
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  recommendedLabel?: string;
}) {
  return (
    <article className={`rounded-lg border bg-white p-5 shadow-sm sm:p-6 ${highlighted ? "border-blue-300" : "border-zinc-200"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{name}</h3>
          <p className="mt-2 text-sm text-zinc-600">{description}</p>
        </div>
        {highlighted ? (
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
            {recommendedLabel}
          </span>
        ) : null}
      </div>
      <p className="mt-6 text-2xl font-semibold sm:text-3xl">{price}</p>
      <ul className="mt-6 space-y-3 text-sm text-zinc-700">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link href={href} className={buttonClass({ variant: highlighted ? "primary" : "secondary", size: "full", className: "mt-6" })}>
        {cta}
      </Link>
    </article>
  );
}
