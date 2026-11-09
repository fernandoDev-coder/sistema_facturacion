import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";
import { buttonClass } from "@/components/button-styles";
import { getLocale } from "@/lib/i18n";

export async function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  const es = await getLocale() === "es";
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo href="/" />
          <Link href="/" className={buttonClass({ variant: "secondary", size: "sm" })}>
            {es ? "Volver" : "Back"}
          </Link>
        </header>
        <article className="mt-10 rounded-lg border border-zinc-200 bg-white p-5 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Legal</p>
          <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{es ? "Última actualización" : "Last updated"}: {updatedAt}</p>
          <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-700">{children}</div>
        </article>
      </section>
      <LegalFooter />
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
