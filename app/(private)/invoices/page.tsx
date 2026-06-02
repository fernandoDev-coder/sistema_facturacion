import Link from "next/link";
import { deleteInvoiceAction, markInvoicePaidAction } from "@/app/actions/invoices";
import { buttonClass } from "@/components/button-styles";
import { ConfirmForm } from "@/components/confirm-form";
import { Message } from "@/components/message";
import { StatusBadge } from "@/components/status-badge";
import { money } from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/i18n";
import { canExportInvoices, getProfileForLimits } from "@/lib/plan-limits";
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
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();
  const profile = await getProfileForLimits(supabase, user.id);
  const canExportCsv = canExportInvoices(profile);
  const defaultExportRange = currentMonthRange();

  const { data: communities } = await supabase.from("communities").select("*").eq("owner_id", user.id).order("name");

  let query = supabase
    .from("invoices")
    .select("*, communities(id,name,tax_id,city)")
    .eq("owner_id", user.id)
    .eq("document_type", "invoice")
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
          <h1 className="text-2xl font-semibold">{t.pages.invoices.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t.pages.invoices.description}</p>
        </div>
        <div className="grid gap-2 sm:flex">
          <Link href="/invoices/create-month" className={buttonClass({ variant: "secondary", size: "full", className: "sm:w-auto" })}>
            {t.pages.invoices.createMonth}
          </Link>
          <Link href="/invoices/new" className={buttonClass({ variant: "primary", size: "full", className: "sm:w-auto" })}>
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

      <section className="rounded-md border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold text-zinc-950">{t.pages.invoices.exportTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              {canExportCsv ? t.pages.invoices.exportDescription : t.pages.invoices.exportUnavailable}
            </p>
          </div>
          {!canExportCsv ? (
            <Link href="/settings/billing" className={buttonClass({ variant: "warning", size: "full", className: "sm:w-auto" })}>
              {t.common.viewPlans}
            </Link>
          ) : null}
        </div>

        {canExportCsv ? (
          <form action="/api/export/invoices.csv" method="get" className="mt-4 grid gap-3 md:grid-cols-5">
            <FilterInput name="from" label={t.pages.invoices.exportFrom} type="date" defaultValue={defaultExportRange.from} />
            <FilterInput name="to" label={t.pages.invoices.exportTo} type="date" defaultValue={defaultExportRange.to} />
            <label>
              <span className="text-sm font-medium text-zinc-800">{t.common.status}</span>
              <select name="status" defaultValue="" className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm">
                <option value="">{t.common.all}</option>
                {invoiceStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {t.statuses[status.value]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-zinc-800">{t.common.client}</span>
              <select name="clientId" defaultValue="" className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm">
                <option value="">{t.common.allFemale}</option>
                {communities?.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button className={buttonClass({ variant: "primary", size: "full" })}>{t.pages.invoices.exportCsv}</button>
            </div>
          </form>
        ) : null}
      </section>

      {invoices.length ? (
        <div className="grid gap-3 sm:hidden">
          {invoices.map((invoice) => (
            <article key={invoice.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-base font-semibold text-zinc-950">{invoice.invoice_number}</h2>
                  <p className="mt-1 break-words text-sm text-zinc-700">{invoice.communities?.name ?? "-"}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {t.months[invoice.month - 1]} {invoice.year}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-zinc-950">{money(invoice.total)}</p>
                  <div className="mt-2">
                    <StatusBadge status={invoice.status} labels={t.statuses} />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href={`/invoices/${invoice.id}/print`} className={buttonClass({ variant: "print", size: "full" })}>
                  {t.common.print}
                </Link>
                <Link href={`/invoices/${invoice.id}/edit`} className={buttonClass({ variant: "warning", size: "full" })}>
                  {t.common.edit}
                </Link>
                {invoice.status !== "paid" ? (
                  <form action={markInvoicePaidAction}>
                    <input type="hidden" name="id" value={invoice.id} />
                    <button className={buttonClass({ variant: "success", size: "full" })}>{t.pages.invoices.paid}</button>
                  </form>
                ) : null}
                <ConfirmForm
                  action={deleteInvoiceAction}
                  id={invoice.id}
                  label={t.common.delete}
                  message={t.pages.invoices.deleteConfirm}
                  fields={{ redirect_path: "/invoices" }}
                  className="w-full"
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-500 sm:hidden">
          {t.pages.invoices.empty}
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
            {invoices.length ? (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3 font-medium">{invoice.invoice_number}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700">{invoice.communities?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {t.months[invoice.month - 1]} {invoice.year}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{money(invoice.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status} labels={t.statuses} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link href={`/invoices/${invoice.id}/print`} className={buttonClass({ variant: "print", size: "sm" })}>
                        {t.common.print}
                      </Link>
                      <Link href={`/invoices/${invoice.id}/edit`} className={buttonClass({ variant: "warning", size: "sm" })}>
                        {t.common.edit}
                      </Link>
                      {invoice.status !== "paid" ? (
                        <form action={markInvoicePaidAction} className="inline">
                          <input type="hidden" name="id" value={invoice.id} />
                          <button className={buttonClass({ variant: "success", size: "sm" })}>{t.pages.invoices.paid}</button>
                        </form>
                      ) : null}
                      <ConfirmForm
                        action={deleteInvoiceAction}
                        id={invoice.id}
                        label={t.common.delete}
                        message={t.pages.invoices.deleteConfirm}
                        fields={{ redirect_path: "/invoices" }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
                  {t.pages.invoices.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function currentMonthRange() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
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
