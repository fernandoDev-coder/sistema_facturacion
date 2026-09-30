import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClass } from "@/components/button-styles";
import { getLocale } from "@/lib/i18n";

export default async function NotFound() {
  const locale = await getLocale();
  const copy = locale === "es"
    ? {
        eyebrow: "Error 404",
        title: "Esta página se ha salido de las cuentas",
        description: "La dirección no existe o el contenido se ha movido. Puedes volver al inicio o abrir tu panel.",
        home: "Volver al inicio",
        dashboard: "Ir al dashboard",
      }
    : {
        eyebrow: "Error 404",
        title: "This page is off the books",
        description: "The address does not exist or the content has moved. You can return home or open your dashboard.",
        home: "Back home",
        dashboard: "Go to dashboard",
      };

  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-zinc-50 px-4 py-10 text-zinc-950">
      <section className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-100 blur-3xl" aria-hidden="true" />
        <BrandLogo href="/" />
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{copy.eyebrow}</p>
        <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-tight sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-xl leading-7 text-zinc-600">{copy.description}</p>
        <div className="mt-7 grid gap-3 sm:flex">
          <Link href="/" className={buttonClass({ variant: "primary", size: "full", className: "sm:w-auto" })}>{copy.home}</Link>
          <Link href="/dashboard" className={buttonClass({ variant: "secondary", size: "full", className: "sm:w-auto" })}>{copy.dashboard}</Link>
        </div>
        <p className="pointer-events-none absolute bottom-3 right-6 font-mono text-7xl font-bold text-zinc-100 sm:text-9xl" aria-hidden="true">404</p>
      </section>
    </main>
  );
}
