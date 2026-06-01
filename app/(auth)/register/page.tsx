import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { FormButton } from "@/components/form-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LegalFooter } from "@/components/legal-footer";
import { Message } from "@/components/message";
import { PasswordField } from "@/components/password-field";
import { RememberSessionField } from "@/components/remember-session-field";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const languageLabels = { language: t.common.language, es: t.common.spanish, en: t.common.english };

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50">
      <section className="flex flex-1 items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <BrandLogo href="/" />
            <LanguageSwitcher locale={locale} labels={languageLabels} />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-950">{t.auth.registerTitle}</h1>
          <p className="mt-2 text-sm text-zinc-600">{t.auth.registerDescription}</p>
          <Message text={message} />
          <form action={registerAction} autoComplete="on" className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-800">{t.auth.email}</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <PasswordField
              label={t.auth.password}
              minLength={10}
              autoComplete="new-password"
              showLabel={t.auth.showPassword}
              hideLabel={t.auth.hidePassword}
            />
            <PasswordField
              label={t.auth.confirmPassword}
              name="password_confirm"
              minLength={10}
              autoComplete="new-password"
              showLabel={t.auth.showPassword}
              hideLabel={t.auth.hidePassword}
            />
            <RememberSessionField title={t.auth.rememberTitle} description={t.auth.rememberDescription} />
            <FormButton className="w-full">{t.common.register}</FormButton>
          </form>
          <p className="mt-5 text-center text-sm text-zinc-600">
            {t.auth.alreadyAccount}{" "}
            <Link href="/login" className="font-medium text-slate-900 hover:underline">
              {t.auth.signIn}
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-zinc-600">
            <Link href="/pricing" className="font-medium text-slate-900 hover:underline">
              {t.auth.viewPricing}
            </Link>
          </p>
        </div>
      </section>
      <LegalFooter />
    </main>
  );
}
