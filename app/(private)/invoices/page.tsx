import Link from "next/link";
import { deleteInvoiceAction, markInvoicePaidAction } from "@/app/actions/invoices";
import { buttonClass } from "@/components/button-styles";
import { ConfirmForm } from "@/components/confirm-form";
import { Message } from "@/components/message";
import { StatusBadge } from "@/components/status-badge";
import { money, monthNames } from "@/lib/format";
import { createClient, requireUser } from "@/lib/supabase/server";
import { invoiceStatuses, type InvoiceStatus, type InvoiceWithCommunity } from "@/lib/types";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    community?: string;
    status?: string;
    message?: string;
  }>;
}) {
  const user = await requireUser();
  const filters = await searchParams;
  const supabase = await createClient();

  const { data: communities } = await supabase
    .from("communities")
    .select("*")
    .eq("owner_id", user.id)
    .order("name");

  let query = supabase
    .from("invoices")
    .select("*, communities(id,name,tax_id,city)")
    .eq("owner_id", user.id)
    .order("invoice_date", { ascending: false })
    .order("invoice_number", { ascending: false });

  if (filters.year) query = query.eq("year", Number(filters.year));
  if (filters.month) query = query.eq("month", Number(filters.month));
  if (filters.community) query = query.eq("community_id", filters.community);
  if (isInvoiceStatus(filters.status)) query = query.eq("status", filters.status);

  const { data, error } = await query;
  const invoices = (data ?? []) as InvoiceWithCommunity[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facturas</h1>
          <p className="mt-1 text-sm text-zinc-600">Listado, filtros y acciones de cobro.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices/create-month" className={buttonClass({ variant: "secondary" })}>
            Crear mes
          </Link>
          <Link href="/invoices/new" className={buttonClass({ variant: "primary" })}>
            Crear
          </Link>
        </div>
      </div>
      <Message text={filters.message ?? error?.message} />

      <form className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 md:grid-cols-5">
        <FilterInput name="year" label="Año" type="number" defaultValue={filters.year} />
        <label>
          <span className="text-sm font-medium text-zinc-800">Mes</span>
          <select name="month" defaultValue={filters.month ?? ""} className="mt-1 h-10 w-full rounded-md border border-zinc-300 px-3 text-sm">
            <option value="">Todos</option>
            {monthNames.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-medium text-zinc-800">Comunidad</span>
          <select name="community" defaultValue={filters.community ?? ""} className="mt-1 h-10 w-full rounded-md border border-zinc-300 px-3 text-sm">
            <option value="">Todas</option>
            {communities?.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-medium text-zinc-800">Estado</span>
          <select name="status" defaultValue={filters.status ?? ""} className="mt-1 h-10 w-full rounded-md border border-zinc-300 px-3 text-sm">
            <option value="">Todos</option>
            {invoiceStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button className={buttonClass({ variant: "secondary", size: "full" })}>
            Filtrar
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Comunidad</th>
              <th className="px-4 py-3">Periodo</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {invoices.length ? (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700">{invoice.communities?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {monthNames[invoice.month - 1]} {invoice.year}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{money(invoice.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link href={`/invoices/${invoice.id}/print`} className={buttonClass({ variant: "print", size: "sm" })}>
                        Imprimir
                      </Link>
                      <Link href={`/invoices/${invoice.id}/edit`} className={buttonClass({ variant: "warning", size: "sm" })}>
                        Editar
                      </Link>
                      {invoice.status !== "paid" ? (
                        <form action={markInvoicePaidAction} className="inline">
                          <input type="hidden" name="id" value={invoice.id} />
                          <button className={buttonClass({ variant: "success", size: "sm" })}>Pagada</button>
                        </form>
                      ) : null}
                      <ConfirmForm action={deleteInvoiceAction} id={invoice.id} label="Eliminar" message="¿Eliminar esta factura?" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
                  No hay facturas con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isInvoiceStatus(value?: string): value is InvoiceStatus {
  return invoiceStatuses.some((status) => status.value === value);
}

function FilterInput({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        className="mt-1 h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
      />
    </label>
  );
}
