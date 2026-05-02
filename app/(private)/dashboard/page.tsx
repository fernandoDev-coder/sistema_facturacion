import Link from "next/link";
import { buttonClass, type ButtonVariant } from "@/components/button-styles";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ count: communities }, { count: invoices }, { count: pending }] = await Promise.all([
    supabase.from("communities").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("status", "pending"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">Resumen rápido de comunidades y facturación.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Comunidades guardadas" value={communities ?? 0} />
        <Metric label="Facturas creadas" value={invoices ?? 0} />
        <Metric label="Facturas pendientes" value={pending ?? 0} />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Accesos rápidos</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink href="/communities/new" label="Nueva comunidad" variant="primary" />
          <QuickLink href="/communities" label="Ver comunidades" variant="secondary" />
          <QuickLink href="/invoices/create-month" label="Crear facturas del mes" variant="success" />
          <QuickLink href="/invoices" label="Ver facturas" variant="print" />
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
