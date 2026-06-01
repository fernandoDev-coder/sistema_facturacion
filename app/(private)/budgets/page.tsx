import Link from "next/link";
import { deleteInvoiceAction } from "@/app/actions/invoices";
import { buttonClass } from "@/components/button-styles";
import { ConfirmForm } from "@/components/confirm-form";
import { Message } from "@/components/message";
import { StatusBadge } from "@/components/status-badge";
import { money } from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/i18n";
import { createClient, requireUser } from "@/lib/supabase/server";
import { invoiceStatuses, type InvoiceStatus, type InvoiceWithCommunity } from "@/lib/types";

export default async function BudgetsPage({
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
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const { data: communities } = await supabase.from("communities").select("*").eq("owner_id", user.id).order("name");

  let query = supabase
    .from("invoices")
    .select("*, communities(id,name,tax_id,city)")
    .eq("owner_id", user.id)
    .eq("document_type", "budget")
    .order("invoice_date", { ascending: false })
    .order("invoice_number", { ascending: false });

  if (filters.year) query = query.eq("year", Number(filters.year));
  if (filters.month) query = query.eq("month", Number(filters.month));
  if (filters.community) query = query.eq("community_id", filters.community);
  if (isInvoiceStatus(filters.status)) query = query.eq("status", filters.status);

  const { data, error } = await query;
  const budgets = (data ?? []) as InvoiceWithCommunity[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.pages.budgets.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t.pages.budgets.description}</p>
        </div>
        <div className="grid gap-2 sm:flex">
          <Link href="/budgets/new" className={buttonClass({ variant: "primary", size: "full", className: "sm:w-auto" })}>
            {t.common.create}
          </Link>
        </div>
      </div>
      <Message text={filters.message ?? error?.message} />

      <form className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 md:grid-cols-5">
        <FilterInput name="year" label={t.common.year} type="number" defaultValue={filters.year} />
        <label>
          <span className="text-sm font-medium text-zinc-800">{t.common.month}</span>
          <select name="month" defaultValue={filters.month ?? ""} className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm">
            <option value="">{t.common.all}</option>
            {t.months.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-medium text-zinc-800">{t.common.client}</span>
          <select name="community" defaultValue={filters.community ?? ""} className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm">
            <option value="">{t.common.allFemale}</option>
            {communities?.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-medium text-zinc-800">{t.common.status}</span>
          <select name="status" defaultValue={filters.status ?? ""} className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm">
            <option value="">{t.common.all}</option>
            {invoiceStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {t.statuses[status.value]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button className={buttonClass({ variant: "secondary", size: "full" })}>{t.common.filter}</button>
        </div>
      </form>

      {budgets.length ? (
        <div className="grid gap-3 sm:hidden">
          {budgets.map((budget) => (
            <article key={budget.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-base font-semibold text-zinc-950">{budget.invoice_number}</h2>
                  <p className="mt-1 break-words text-sm text-zinc-700">{budget.communities?.name ?? "-"}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {t.months[budget.month - 1]} {budget.year}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-zinc-950">{money(budget.total)}</p>
                  <div className="mt-2">
                    <StatusBadge status={budget.status} labels={t.statuses} />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href={`/budgets/${budget.id}/print`} className={buttonClass({ variant: "print", size: "full" })}>
                  {t.common.print}
                </Link>
                <Link href={`/budgets/${budget.id}/edit`} className={buttonClass({ variant: "warning", size: "full" })}>
                  {t.common.edit}
                </Link>
                <ConfirmForm
                  action={deleteInvoiceAction}
                  id={budget.id}
                  label={t.common.delete}
                  message={t.pages.budgets.deleteConfirm}
                  fields={{ redirect_path: "/budgets" }}
                  className="w-full"
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-500 sm:hidden">
          {t.pages.budgets.empty}
        </div>
      )}

      <div className="hidden overflow-hidden rounded-md border border-zinc-200 bg-white sm:block">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">{t.common.number}</th>
              <th className="px-4 py-3">{t.common.client}</th>
              <th className="px-4 py-3">{t.common.period}</th>
              <th className="px-4 py-3">{t.common.total}</th>
              <th className="px-4 py-3">{t.common.status}</th>
              <th className="px-4 py-3 text-right">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {budgets.length ? (
              budgets.map((budget) => (
                <tr key={budget.id}>
                  <td className="px-4 py-3 font-medium">{budget.invoice_number}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700">{budget.communities?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {t.months[budget.month - 1]} {budget.year}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{money(budget.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={budget.status} labels={t.statuses} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link href={`/budgets/${budget.id}/print`} className={buttonClass({ variant: "print", size: "sm" })}>
                        {t.common.print}
                      </Link>
                      <Link href={`/budgets/${budget.id}/edit`} className={buttonClass({ variant: "warning", size: "sm" })}>
                        {t.common.edit}
                      </Link>
                      <ConfirmForm
                        action={deleteInvoiceAction}
                        id={budget.id}
                        label={t.common.delete}
                        message={t.pages.budgets.deleteConfirm}
                        fields={{ redirect_path: "/budgets" }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
                  {t.pages.budgets.empty}
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
        className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm"
      />
    </label>
  );
}
