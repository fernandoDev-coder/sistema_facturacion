import Link from "next/link";
import { buttonClass } from "@/components/button-styles";

const plans = [
  {
    name: "Gratis",
    price: "0 EUR",
    cadence: "para empezar",
    description: "Para probar la app con pocos clientes y documentos.",
    features: ["5 clientes", "25 documentos al mes", "Facturas y presupuestos", "Impresion A4 desde navegador"],
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
      "Gestion de suscripcion con Stripe",
    ],
    cta: "Empezar con Pro",
    href: "/register",
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/login" className="text-lg font-semibold">
            CuotaClara
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className={buttonClass({ variant: "ghost", size: "sm" })}>
              Entrar
            </Link>
            <Link href="/register" className={buttonClass({ variant: "primary", size: "sm" })}>
              Crear cuenta
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 content-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
              Facturacion mensual simple para clientes recurrentes.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">
              Crea clientes, emite facturas y presupuestos, prepara documentos mensuales y manten tu facturacion
              organizada sin usar un ERP complejo.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <section
                key={plan.name}
                className={`rounded-lg border bg-white p-6 shadow-sm ${
                  plan.highlighted ? "border-blue-200 ring-2 ring-blue-100" : "border-zinc-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{plan.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{plan.description}</p>
                  </div>
                  {plan.highlighted ? (
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                      Lanzamiento
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
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

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
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
