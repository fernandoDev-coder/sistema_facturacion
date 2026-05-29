import Link from "next/link";
import { getDictionary, getLocale } from "@/lib/i18n";

export async function LegalFooter({ className = "" }: { className?: string }) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const legalLinks = [
    { href: "/legal/aviso-legal", label: t.legalFooter.legalNotice },
    { href: "/legal/privacidad", label: t.legalFooter.privacy },
    { href: "/legal/cookies", label: t.legalFooter.cookies },
    { href: "/legal/terminos", label: t.legalFooter.terms },
  ];

  return (
    <footer className={`border-t border-zinc-200 bg-white ${className}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>{t.legalFooter.rights}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-zinc-950 hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
