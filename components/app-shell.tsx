import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClass } from "@/components/button-styles";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";

const navItems = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/clients", key: "clients" },
  { href: "/invoices", key: "invoices" },
  { href: "/budgets", key: "budgets" },
  { href: "/expenses", key: "expenses" },
  { href: "/settings/company", key: "company" },
  { href: "/settings/billing", key: "plan" },
  { href: "/settings/account", key: "account" },
] as const;

type NavKey = (typeof navItems)[number]["key"] | "users";

export function AppShell({
  children,
  email,
  locale,
  showAdminLink = false,
}: {
  children: React.ReactNode;
  email?: string | null;
  locale: Locale;
  showAdminLink?: boolean;
}) {
  const t = getDictionary(locale);
  const visibleNavItems: Array<{ href: string; key: NavKey }> = showAdminLink
    ? [...navItems, { href: "/admin/users", key: "users" }]
    : [...navItems];
  const languageLabels = { language: t.common.language, es: t.common.spanish, en: t.common.english };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-white px-5 py-6 lg:block print:hidden">
        <BrandLogo href="/dashboard" />
        <div className="mt-5">
          <LanguageSwitcher locale={locale} labels={languageLabels} />
        </div>
        <nav className="mt-8 space-y-1">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
            >
              {t.nav[item.key]}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 left-5 right-5">
          <p className="truncate text-xs text-zinc-500">{email}</p>
          <form action={logoutAction} className="mt-3">
            <button className={buttonClass({ variant: "secondary", size: "full" })}>{t.nav.logout}</button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BrandLogo href="/dashboard" markClassName="h-7 w-7" textClassName="text-base" />
          <div className="flex min-w-0 items-center gap-2">
            <LanguageSwitcher locale={locale} labels={languageLabels} />
            <form action={logoutAction}>
              <button className={buttonClass({ variant: "secondary", size: "sm" })}>{t.nav.logoutShort}</button>
            </form>
          </div>
        </div>
        <nav className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-2 py-2 text-center text-xs font-medium leading-tight text-zinc-700 hover:bg-zinc-50 sm:text-sm"
            >
              {t.nav[item.key]}
            </Link>
          ))}
        </nav>
      </header>

      <main className="lg:pl-64 print:p-0">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 print:max-w-none print:p-0">{children}</div>
      </main>
    </div>
  );
}
