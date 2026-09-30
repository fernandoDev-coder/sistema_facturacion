import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClass } from "@/components/button-styles";
import { ContactForm } from "@/components/contact-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LegalFooter } from "@/components/legal-footer";
import { SocialShareButtons } from "@/components/social-share-buttons";
import { contactEmails } from "@/lib/beta-config";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getAbsoluteUrl } from "@/lib/site-url";

export default async function ContactPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const copy = t.experience.contact;
  const languageLabels = { language: t.common.language, es: t.common.spanish, en: t.common.english };

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <BrandLogo href="/" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} labels={languageLabels} />
            <Link href="/" className={buttonClass({ variant: "ghost", size: "sm" })}>{t.common.back}</Link>
          </div>
        </header>

        <div className="grid gap-8 py-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{copy.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">{copy.title}</h1>
            <p className="mt-4 max-w-lg leading-7 text-zinc-600">{copy.description}</p>
            <a href={`mailto:${contactEmails.support}`} className="mt-5 inline-block font-medium text-blue-700 hover:underline">
              {contactEmails.support}
            </a>
            <div className="mt-8">
              <SocialShareButtons label={copy.share} url={getAbsoluteUrl("/contact")} title="FaktuDash" />
            </div>
          </div>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="contact-form-title">
            <h2 id="contact-form-title" className="text-xl font-semibold">{copy.formTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{copy.formHelp}</p>
            <div className="mt-6">
              <ContactForm email={contactEmails.support} labels={copy.form} locale={locale} />
            </div>
          </section>
        </div>
      </section>
      <LegalFooter />
    </main>
  );
}
