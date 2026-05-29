import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClass } from "@/components/button-styles";

const plans = [
  {
    name: "Gratis",
    price: "0 EUR",
    cadence: "para empezar",
    description: "Para probar CuotaClara con pocos clientes y documentos.",
    features: ["5 clientes", "25 documentos al mes", "Facturas y presupuestos", "Impresion A4 desde navegador"],
    notIncluded: ["Facturacion mensual masiva", "Clientes ilimitados", "Documentos ilimitados"],
    cta: "Crear cuenta gratis",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "7,90 EUR",
    cadence: "al mes + IVA",
    description: "Para autonomos y pequenos negocios con facturacion recurrente.",
    features: [
      "Clientes ilimitados",
      "Documentos ilimitados",
      "Facturacion mensual masiva",
      "Logo y datos de empresa en documentos",
    ],
    notIncluded: [],
    cta: "Empezar con Pro",
    href: "/register",
    highlighted: true,
  },
];

const comparison = [
  { label: "Clientes", free: "5", pro: "Ilimitados" },
  { label: "Documentos al mes", free: "25", pro: "Ilimitados" },
  { label: "Facturas y presupuestos", free: "Incluido", pro: "Incluido" },
  { label: "Impresion A4", free: "Incluido", pro: "Incluido" },
  { label: "Facturacion mensual masiva", free: "No incluido", pro: "Incluido" },
  { label: "Logo y datos de empresa", free: "Basico", pro: "Completo" },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo href="/" />
          <nav className="flex items-center gap-2">
            <Link href="/login" className={buttonClass({ variant: "ghost", size: "sm" })}>
              Entrar
            </Link>
            <Link href="/register" className={buttonClass({ variant: "primary", size: "sm" })}>
              Crear cuenta
            </Link>
          </nav>
        </header>

        <section className="py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Planes</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
            Empieza gratis y pasa a Pro cuando factures cada mes.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600">
            El plan Gratis sirve para probar la app. Pro esta pensado para autonomos con clientes recurrentes,
            mas documentos y generacion mensual en bloque.
          </p>
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
                    Recomendado
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
                    <li key={feature}>No incluye: {feature}</li>
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
            <h2 className="font-semibold">Comparacion rapida</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {comparison.map((row) => (
              <div key={row.label} className="grid grid-cols-3 gap-3 px-5 py-4 text-sm">
                <p className="font-medium text-zinc-950">{row.label}</p>
                <p className="text-zinc-600">{row.free}</p>
                <p className="font-medium text-zinc-900">{row.pro}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-950">Pro se activa con pago seguro</h2>
          <p className="mt-2 text-sm leading-6 text-blue-900">
            Crea tu cuenta, entra en Plan y facturacion y mejora a Pro. El pago se gestiona de forma segura y el
            acceso se aplica a tu cuenta.
          </p>
          <Link href="/register" className={buttonClass({ variant: "primary", className: "mt-4" })}>
            Crear cuenta y elegir Pro
          </Link>
        </section>
      </section>
    </main>
  );
}
