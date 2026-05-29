import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClass } from "@/components/button-styles";

const benefits = [
  "Crea facturas y presupuestos sin pelearte con un ERP.",
  "Guarda clientes recurrentes y reutiliza sus datos fiscales.",
  "Genera documentos A4 listos para imprimir desde el navegador.",
  "Controla limites del plan y pasa a Pro cuando tengas mas volumen.",
];

const idealFor = [
  "Autonomos con clientes fijos",
  "Limpieza y mantenimiento de piscinas",
  "Jardineros y servicios mensuales",
  "Tecnicos y oficios",
  "Comunidades y pequenos administradores",
  "Negocios que facturan cada mes",
];

const features = [
  "Clientes",
  "Facturas",
  "Presupuestos",
  "Facturacion mensual",
  "Datos de empresa",
  "Logo en documentos",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo href="/" />
          <nav className="flex items-center gap-2">
            <Link href="/pricing" className={buttonClass({ variant: "ghost", size: "sm" })}>
              Precios
            </Link>
            <Link href="/login" className={buttonClass({ variant: "secondary", size: "sm" })}>
              Entrar
            </Link>
            <Link href="/register" className={buttonClass({ variant: "primary", size: "sm" })}>
              Crear cuenta
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 gap-10 py-12 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Facturacion simple para negocios recurrentes
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl">
              Facturas mensuales claras sin montar un ERP.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">
              FaktuFlow ayuda a autonomos y pequenos negocios a gestionar clientes, facturas y presupuestos
              imprimibles desde una herramienta sencilla.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className={buttonClass({ variant: "primary" })}>
                Crear cuenta gratis
              </Link>
              <Link href="/pricing" className={buttonClass({ variant: "secondary" })}>
                Ver planes
              </Link>
            </div>
          </div>

          <InvoicePreview />
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold">El problema que resuelve</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Muchos pequenos negocios repiten las mismas facturas cada mes, guardan datos en hojas sueltas y
              pierden tiempo preparando documentos basicos. FaktuFlow concentra ese flujo en una app ligera.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Funcionalidades principales</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium">
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Ideal para</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {idealFor.map((item) => (
                <div key={item} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
          <PlanCard
            name="Gratis"
            price="0 EUR"
            description="Para probar FaktuFlow con poca actividad."
            features={["5 clientes", "25 documentos al mes", "Facturas y presupuestos", "Impresion A4"]}
            cta="Crear cuenta gratis"
            href="/register"
          />
          <PlanCard
            name="Pro"
            price="7,90 EUR/mes + IVA"
            description="Para autonomos con facturacion recurrente."
            features={["Clientes ilimitados", "Documentos ilimitados", "Facturacion mensual masiva", "Logo y datos de empresa"]}
            cta="Empezar con Pro"
            href="/pricing"
            highlighted
          />
        </div>
      </section>
    </main>
  );
}

function InvoicePreview() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <p className="text-lg font-semibold">Factura mensual</p>
          <p className="mt-1 text-sm text-zinc-500">Servicio mantenimiento - Mayo 2026</p>
        </div>
        <div className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white">A4</div>
      </div>
      <div className="mt-6 grid gap-4 text-sm">
        <PreviewRow label="Cliente" value="Comunidad Alameda" />
        <PreviewRow label="Concepto" value="Cuota mensual de mantenimiento" />
        <PreviewRow label="Base" value="120,00 EUR" />
        <PreviewRow label="IVA" value="25,20 EUR" />
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 text-base font-semibold">
          <span>Total</span>
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
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <article className={`rounded-lg border bg-white p-6 shadow-sm ${highlighted ? "border-blue-300" : "border-zinc-200"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{name}</h3>
          <p className="mt-2 text-sm text-zinc-600">{description}</p>
        </div>
        {highlighted ? (
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
            Recomendado
          </span>
        ) : null}
      </div>
      <p className="mt-6 text-3xl font-semibold">{price}</p>
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
