import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClass, type ButtonVariant } from "@/components/button-styles";
import { money, monthNames } from "@/lib/format";
import { getCompanySetupStatus } from "@/lib/onboarding";
import {
  getClientCount,
  getCurrentMonthDocumentCount,
  getPlanLimits,
  hasPaidAccess,
} from "@/lib/plan-limits";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { InvoiceWithCommunity } from "@/lib/types";

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();

  if (profile && !profile.onboarding_completed_at) {
    redirect("/welcome");
  }

  const supabase = await createClient();
  const limits = getPlanLimits(profile);
  const isPro = hasPaidAccess(profile);

  const [
    clients,
    documentsThisMonth,
    { count: invoices },
    { count: pending },
    { count: budgets },
    { data: recentInvoices },
    { data: recentBudgets },
    { data: company },
  ] = await Promise.all([
    getClientCount(supabase, user.id),
    getCurrentMonthDocumentCount(supabase, user.id),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("document_type", "invoice"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("document_type", "invoice")
      .eq("status", "pending"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("document_type", "budget"),
    supabase
      .from("invoices")
      .select("*, communities(id,name,tax_id,city)")
      .eq("owner_id", user.id)
      .eq("document_type", "invoice")
      .order("invoice_date", { ascending: false })
      .order("invoice_number", { ascending: false })
      .limit(5),
    supabase
      .from("invoices")
      .select("*, communities(id,name,tax_id,city)")
      .eq("owner_id", user.id)
      .eq("document_type", "budget")
      .order("invoice_date", { ascending: false })
      .order("invoice_number", { ascending: false })
      .limit(5),
    supabase.from("company_settings").select("*").eq("owner_id", user.id).maybeSingle(),
  ]);

  const companyStatus = getCompanySetupStatus(company, { requireLogo: limits.companyLogo });
  const invoicesList = (recentInvoices ?? []) as InvoiceWithCommunity[];
  const budgetsList = (recentBudgets ?? []) as InvoiceWithCommunity[];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">Panel principal</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Lo importante de tu facturacion, sin ruido.
          </p>
        </div>
        {!isPro ? (
          <Link href="/settings/billing" className={buttonClass({ variant: "primary" })}>
            Mejorar a Pro
          </Link>
        ) : null}
      </div>

      {!companyStatus.completed ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-amber-950">Completa los datos de tu empresa</h2>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Faltan {companyStatus.missingFields.map((field) => field.label).join(", ")}. Estos datos salen en
                tus facturas y presupuestos.
              </p>
            </div>
            <Link href="/settings/company" className={buttonClass({ variant: "warning" })}>
              Completar empresa
            </Link>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Clientes"
          value={limits.clients === null ? String(clients) : `${clients} de ${limits.clients}`}
          hint={limits.clients === null ? "Sin limite en Pro" : "Plan Gratis"}
          warn={limits.clients !== null && clients >= limits.clients}
        />
        <Metric
          label="Documentos este mes"
          value={limits.documentsPerMonth === null ? String(documentsThisMonth) : `${documentsThisMonth} de ${limits.documentsPerMonth}`}
          hint={limits.documentsPerMonth === null ? "Sin limite en Pro" : "Facturas y presupuestos"}
          warn={limits.documentsPerMonth !== null && documentsThisMonth >= limits.documentsPerMonth}
        />
        <Metric label="Facturas creadas" value={String(invoices ?? 0)} hint={`${pending ?? 0} pendientes`} />
        <Metric label="Presupuestos creados" value={String(budgets ?? 0)} hint={isPro ? "Plan Pro activo" : "Plan Gratis"} />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Accesos rapidos</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickLink href="/invoices/new" label="Crear factura" variant="primary" />
          <QuickLink href="/budgets/new" label="Crear presupuesto" variant="warning" />
          <QuickLink href="/clients/new" label="Crear cliente" variant="secondary" />
          <QuickLink href="/invoices/create-month" label="Facturacion mensual" variant="success" />
          <QuickLink href="/settings/company" label="Datos de empresa" variant="secondary" />
          <QuickLink href="/settings/billing" label="Ver plan y limites" variant="secondary" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RecentDocuments
          title="Facturas recientes"
          documents={invoicesList}
          emptyText="Todavia no has creado facturas."
          emptyHref="/invoices/new"
          emptyCta="Crear primera factura"
        />
        <RecentDocuments
          title="Presupuestos recientes"
          documents={budgetsList}
          emptyText="Todavia no has creado presupuestos."
          emptyHref="/budgets/new"
          emptyCta="Crear primer presupuesto"
        />
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  warn = false,
}: {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-white p-5 shadow-sm ${warn ? "border-amber-300" : "border-zinc-200"}`}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function QuickLink({
  href,
  label,
  variant,
}: {
  href: string;
  label: string;
  variant: ButtonVariant;
}) {
  return (
    <Link href={href} className={buttonClass({ variant, className: "justify-start shadow-sm" })}>
      {label}
    </Link>
  );
}

function RecentDocuments({
  title,
  documents,
  emptyText,
  emptyHref,
  emptyCta,
}: {
  title: string;
  documents: InvoiceWithCommunity[];
  emptyText: string;
  emptyHref: string;
  emptyCta: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="font-semibold text-zinc-950">{title}</h2>
      </div>
      {documents.length ? (
        <div className="divide-y divide-zinc-100">
          {documents.map((document) => (
            <Link
              key={document.id}
              href={`/${document.document_type === "budget" ? "budgets" : "invoices"}/${document.id}/edit`}
              className="grid gap-1 px-5 py-4 hover:bg-zinc-50"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-zinc-950">{document.invoice_number}</p>
                <p className="text-sm font-semibold text-zinc-900">{money(document.total)}</p>
              </div>
              <p className="text-sm text-zinc-600">{document.communities?.name ?? "Cliente sin nombre"}</p>
              <p className="text-xs text-zinc-500">
                {monthNames[document.month - 1]} {document.year}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-600">{emptyText}</p>
          <Link href={emptyHref} className={buttonClass({ variant: "primary", className: "mt-4" })}>
            {emptyCta}
          </Link>
        </div>
      )}
    </section>
  );
}
