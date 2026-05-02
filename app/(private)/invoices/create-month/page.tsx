import Link from "next/link";
import { CreateMonthForm } from "@/components/create-month-form";
import { Message } from "@/components/message";
import { currentMonthYear } from "@/lib/format";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function CreateMonthPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; message?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const fallback = currentMonthYear();
  const month = Number(params.month ?? fallback.month);
  const year = Number(params.year ?? fallback.year);
  const supabase = await createClient();

  const [{ data: communities }, { data: existingInvoices }] = await Promise.all([
    supabase.from("communities").select("*").eq("owner_id", user.id).order("name"),
    supabase.from("invoices").select("community_id,month,year").eq("owner_id", user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/invoices" className="text-sm font-medium text-zinc-600 hover:text-zinc-950">
          Volver
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Crear facturas del mes</h1>
        <p className="mt-1 text-sm text-zinc-600">Genera una factura en borrador por comunidad seleccionada.</p>
      </div>
      <Message text={params.message} />
      {communities?.length ? (
        <CreateMonthForm
          communities={communities}
          existingInvoices={existingInvoices ?? []}
          initialMonth={month}
          initialYear={year}
        />
      ) : (
        <div className="rounded-md border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">No hay comunidades disponibles.</p>
          <Link href="/communities/new" className="mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Nueva comunidad
          </Link>
        </div>
      )}
    </div>
  );
}
