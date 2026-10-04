import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { buttonClass } from "@/components/button-styles";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Demo del panel",
  robots: { index: false, follow: false },
};

const documents = [
  { number: "F-2026-018", client: "Comunidad Alameda", date: "28/09/2026", total: "145,20 €", status: "Emitida" },
  { number: "F-2026-017", client: "Estudio Norte", date: "24/09/2026", total: "363,00 €", status: "Emitida" },
  { number: "F-2026-016", client: "Jardines del Sur", date: "18/09/2026", total: "217,80 €", status: "Borrador" },
] as const;

export default async function DemoPage() {
  const locale = await getLocale();
  const copy = locale === "es" ? es : en;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-white px-5 py-6 lg:block">
        <BrandLogo href="/" />
        <span className="mt-5 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
          {copy.readOnly}
        </span>
        <nav className="mt-7 space-y-1" aria-label={copy.demoNavigation}>
          {copy.nav.map((item, index) => (
            <a
              key={item}
              href={index === 0 ? "#dashboard" : `#${index}`}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition ${index === 0 ? "bg-blue-50 text-blue-700" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"}`}
            >
              {item}
            </a>
          ))}
        </nav>
        <Link href="/" className={buttonClass({ variant: "secondary", size: "full", className: "absolute bottom-6 left-5 right-5 w-auto" })}>
          {copy.leaveDemo}
        </Link>
      </aside>

      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <BrandLogo href="/" markClassName="h-7 w-7" textClassName="text-base" />
          <Link href="/" className={buttonClass({ variant: "secondary", size: "sm" })}>{copy.leaveDemo}</Link>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label={copy.demoNavigation}>
          {copy.nav.slice(0, 4).map((item, index) => (
            <a key={item} href={index === 0 ? "#dashboard" : `#${index}`} className="shrink-0 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium">
              {item}
            </a>
          ))}
        </nav>
      </header>

      <div className="lg:pl-64">
        <div id="dashboard" className="mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="font-semibold text-blue-950">{copy.previewTitle}</p>
              <p className="mt-1 text-sm leading-6 text-blue-900">{copy.previewDescription}</p>
            </div>
            <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 sm:mt-0">{copy.noRealData}</span>
          </section>

          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">{copy.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold">{copy.title}</h1>
            <p className="mt-2 text-sm text-zinc-600">{copy.description}</p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DemoMetric label={copy.clients} value="42" hint={copy.activeClients} />
            <DemoMetric label={copy.documents} value="18" hint={copy.currentMonth} progress={60} />
            <DemoMetric label={copy.invoices} value="128" hint={`112 ${copy.issued}`} />
            <DemoMetric label={copy.budgets} value="31" hint={copy.proPlan} />
          </section>

          <section>
            <h2 className="text-lg font-semibold">{copy.quickActions}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {copy.actions.map((action, index) => (
                <button
                  key={action}
                  type="button"
                  disabled
                  title={copy.readOnlyHelp}
                  className={`min-h-11 rounded-md border px-4 py-2.5 text-left text-sm font-semibold opacity-80 ${index === 0 ? "border-blue-700 bg-blue-700 text-white" : "border-zinc-300 bg-white text-zinc-800"}`}
                >
                  {action}
                </button>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="font-semibold">{copy.recentInvoices}</h2>
              <span className="text-xs text-zinc-500">{copy.exampleData}</span>
            </div>
            <div className="divide-y divide-zinc-100">
              {documents.map((document) => (
                <div key={document.number} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1.3fr_auto_auto] sm:items-center sm:gap-4">
                  <p className="font-medium">{document.number}</p>
                  <p className="text-sm text-zinc-600">{document.client}</p>
                  <div className="flex items-center justify-between gap-4 sm:contents">
                    <p className="text-sm text-zinc-500">{document.date}</p>
                    <div className="text-right">
                      <p className="font-semibold">{document.total}</p>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${document.status === "Emitida" ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-700"}`}>
                        {document.status === "Emitida" ? copy.issuedLabel : copy.draftLabel}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function DemoMetric({ label, value, hint, progress }: { label: string; value: string; hint: string; progress?: number }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {progress !== undefined ? (
        <div
          className="mt-4 h-2 rounded-full bg-zinc-100"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="h-2 rounded-full bg-blue-700" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      <p className="mt-2 text-xs text-zinc-500">{hint}</p>
    </article>
  );
}

const es = {
  readOnly: "Demo · solo lectura",
  demoNavigation: "Navegación de demostración",
  nav: ["Dashboard", "Clientes", "Facturas", "Presupuestos", "Gastos", "Empresa"],
  leaveDemo: "Salir de la demo",
  previewTitle: "Estás viendo una demostración segura",
  previewDescription: "Puedes explorar el aspecto del panel sin cuenta. Los controles de edición están desactivados y no se consulta información real.",
  noRealData: "Datos ficticios",
  eyebrow: "Vista interior",
  title: "Panel principal",
  description: "Lo importante de tu facturación, sin ruido.",
  clients: "Clientes",
  activeClients: "38 activos este mes",
  documents: "Documentos este mes",
  currentMonth: "Septiembre de 2026",
  invoices: "Facturas creadas",
  issued: "emitidas",
  budgets: "Presupuestos creados",
  proPlan: "Plan Pro de demostración",
  quickActions: "Accesos rápidos",
  actions: ["Crear factura", "Crear presupuesto", "Crear cliente", "Facturación mensual", "Datos de empresa", "Ver plan y límites"],
  readOnlyHelp: "Acción desactivada en la demo de solo lectura",
  recentInvoices: "Facturas recientes",
  exampleData: "Ejemplos",
  issuedLabel: "Emitida",
  draftLabel: "Borrador",
} as const;

const en = {
  readOnly: "Demo · read only",
  demoNavigation: "Demo navigation",
  nav: ["Dashboard", "Clients", "Invoices", "Quotes", "Expenses", "Company"],
  leaveDemo: "Exit demo",
  previewTitle: "You are viewing a safe demonstration",
  previewDescription: "Explore the dashboard without an account. Editing controls are disabled and no real information is queried.",
  noRealData: "Fictional data",
  eyebrow: "Inside view",
  title: "Main dashboard",
  description: "The essentials of your invoicing, without noise.",
  clients: "Clients",
  activeClients: "38 active this month",
  documents: "Documents this month",
  currentMonth: "September 2026",
  invoices: "Invoices created",
  issued: "issued",
  budgets: "Quotes created",
  proPlan: "Demo Pro plan",
  quickActions: "Quick actions",
  actions: ["Create invoice", "Create quote", "Create client", "Monthly invoicing", "Company details", "View plan and limits"],
  readOnlyHelp: "Action disabled in the read-only demo",
  recentInvoices: "Recent invoices",
  exampleData: "Examples",
  issuedLabel: "Issued",
  draftLabel: "Draft",
} as const;
