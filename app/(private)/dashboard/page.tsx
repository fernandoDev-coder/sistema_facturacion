import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClass, type ButtonVariant } from "@/components/button-styles";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();

  if (profile && !profile.onboarding_completed_at) {
    redirect("/welcome");
  }

  const supabase = await createClient();

  const [{ count: communities }, { count: invoices }, { count: pending }, { count: budgets }] = await Promise.all([
    supabase.from("communities").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
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
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">Resumen rapido de comunidades, facturas y presupuestos.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Comunidades guardadas" value={communities ?? 0} />
        <Metric label="Facturas creadas" value={invoices ?? 0} />
        <Metric label="Facturas pendientes" value={pending ?? 0} />
        <Metric label="Presupuestos creados" value={budgets ?? 0} />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Accesos rapidos</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickLink href="/communities/new" label="Nueva comunidad" variant="primary" />
          <QuickLink href="/communities" label="Ver comunidades" variant="secondary" />
          <QuickLink href="/invoices/create-month" label="Crear facturas del mes" variant="success" />
          <QuickLink href="/invoices" label="Ver facturas" variant="print" />
          <QuickLink href="/budgets/new" label="Nuevo presupuesto" variant="warning" />
          <QuickLink href="/budgets" label="Ver presupuestos" variant="secondary" />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
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
