import Link from "next/link";
import { updateRecoveredPasswordAction } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { FormButton } from "@/components/form-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LegalFooter } from "@/components/legal-footer";
import { Message } from "@/components/message";
import { PasswordField } from "@/components/password-field";
import { getDictionary, getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const languageLabels = { language: t.common.language, es: t.common.spanish, en: t.common.english };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50">
      <section className="flex flex-1 items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <BrandLogo href="/" />
            <LanguageSwitcher locale={locale} labels={languageLabels} />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-950">{t.auth.resetPasswordTitle}</h1>
          <p className="mt-2 text-sm text-zinc-600">{t.auth.resetPasswordDescription}</p>
          <Message text={message ?? (!user ? t.auth.recoveryLinkInvalid : undefined)} />
          {user ? (
            <form action={updateRecoveredPasswordAction} autoComplete="on" className="mt-6 space-y-4">
              <div className="space-y-2">
                <PasswordField
                  label={t.auth.newPassword}
                  minLength={10}
                  autoComplete="new-password"
                  showLabel={t.auth.showPassword}
                  hideLabel={t.auth.hidePassword}
                />
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                  <p className="font-medium text-zinc-800">{t.auth.passwordHelp}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    <li>{t.auth.passwordRuleLength}</li>
                    <li>{t.auth.passwordRuleUppercase}</li>
                    <li>{t.auth.passwordRuleSymbol}</li>
                  </ul>
                </div>
              </div>
              <PasswordField
                label={t.auth.confirmPassword}
                name="password_confirm"
                minLength={10}
                autoComplete="new-password"
                showLabel={t.auth.showPassword}
                hideLabel={t.auth.hidePassword}
              />
              <FormButton className="w-full" pendingText={t.auth.updatingPassword}>
                {t.auth.updatePassword}
              </FormButton>
            </form>
          ) : (
            <p className="mt-5 text-center text-sm text-zinc-600">
              <Link href="/forgot-password" className="font-medium text-slate-900 hover:underline">
                {t.auth.requestNewRecovery}
              </Link>
            </p>
          )}
        </div>
      </section>
      <LegalFooter />
    </main>
  );
}
