import { createExpenseDocumentAction } from "@/app/actions/expenses";
import { buttonClass } from "@/components/button-styles";
import { Message } from "@/components/message";
import { money } from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/i18n";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { ExpenseDocument, ExpenseDocumentStatus } from "@/lib/types";

const spanishStatusLabels: Record<ExpenseDocumentStatus, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  archived: "Archivada",
};

const englishStatusLabels: Record<ExpenseDocumentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  archived: "Archived",
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; year?: string; quarter?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const labels = t.pages.expenses;
  const expenseStatusLabels = locale === "es" ? spanishStatusLabels : englishStatusLabels;
  const supabase = await createClient();
  const selectedYear = parseYear(params.year);
  const selectedQuarter = parseQuarter(params.quarter);
  const range = dateRangeForFilter(selectedYear, selectedQuarter);

  let query = supabase
    .from("expense_documents")
    .select("*")
    .eq("owner_id", user.id)
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (range) {
    query = query.gte("issue_date", range.start).lt("issue_date", range.end);
  }

  const { data } = await query;
  const expenses = (data ?? []) as ExpenseDocument[];
  const signedUrls = await signedUrlsByPath(supabase, expenses);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">{labels.title}</h1>
        <p className="mt-1 text-sm leading-6 text-zinc-600">{labels.description}</p>
      </div>

      <Message text={params.message} />

      <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <form action={createExpenseDocumentAction} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <Field label={labels.supplier} name="supplier_name" required />
            <Field label={labels.invoiceNumber} name="invoice_number" />
            <Field label={labels.issueDate} name="issue_date" type="date" required />
            <Field label={labels.totalAmount} name="total_amount" type="number" step="0.01" required />
            <Field label={labels.taxAmount} name="tax_amount" type="number" step="0.01" />
            <Field label={labels.category} name="category" />
            <label className="block">
              <span className="text-sm font-medium text-zinc-800">{labels.status}</span>
              <select name="status" className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm">
                <option value="pending">{expenseStatusLabels.pending}</option>
                <option value="paid">{expenseStatusLabels.paid}</option>
                <option value="archived">{expenseStatusLabels.archived}</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-800">{labels.file}</span>
              <input
                name="file"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button className={buttonClass({ variant: "primary", size: "full", className: "mt-5" })}>{labels.upload}</button>
        </form>

        <section className="space-y-4">
          <form className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto]">
            <label>
              <span className="text-sm font-medium text-zinc-800">{labels.year}</span>
              <input
                name="year"
                type="number"
                min="2000"
                max="2200"
                defaultValue={selectedYear}
                className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
              />
            </label>
            <label>
              <span className="text-sm font-medium text-zinc-800">{labels.quarter}</span>
              <select
                name="quarter"
                defaultValue={selectedQuarter ?? ""}
                className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
              >
                <option value="">{labels.allQuarters}</option>
                <option value="1">T1</option>
                <option value="2">T2</option>
                <option value="3">T3</option>
                <option value="4">T4</option>
              </select>
            </label>
            <div className="flex items-end">
              <button className={buttonClass({ variant: "secondary", size: "full" })}>{t.common.filter}</button>
            </div>
          </form>

          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">{labels.supplier}</th>
                    <th className="px-4 py-3">{labels.issueDate}</th>
                    <th className="px-4 py-3">{labels.totalAmount}</th>
                    <th className="px-4 py-3">{labels.status}</th>
                    <th className="px-4 py-3">{labels.file}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {expenses.map((expense) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      fileUrl={signedUrls.get(expense.file_url)}
                      labels={labels}
                      locale={locale}
                      statusLabels={expenseStatusLabels}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-zinc-100 md:hidden">
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  fileUrl={signedUrls.get(expense.file_url)}
                  labels={labels}
                  locale={locale}
                  statusLabels={expenseStatusLabels}
                />
              ))}
            </div>

            {!expenses.length ? <p className="px-5 py-8 text-center text-sm text-zinc-600">{labels.empty}</p> : null}
          </div>
        </section>
      </section>
    </div>
  );
}

function ExpenseRow({
  expense,
  fileUrl,
  labels,
  locale,
  statusLabels,
}: {
  expense: ExpenseDocument;
  fileUrl?: string;
  labels: ReturnType<typeof getDictionary>["pages"]["expenses"];
  locale: string;
  statusLabels: Record<ExpenseDocumentStatus, string>;
}) {
  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-950">{expense.supplier_name}</p>
        <p className="text-xs text-zinc-500">{expense.invoice_number ?? "-"}</p>
      </td>
      <td className="px-4 py-3 text-zinc-600">{formatDate(expense.issue_date, locale)}</td>
      <td className="px-4 py-3 font-medium text-zinc-950">{money(expense.total_amount)}</td>
      <td className="px-4 py-3 text-zinc-600">{statusLabels[expense.status]}</td>
      <td className="px-4 py-3">
        {fileUrl ? (
          <a href={fileUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-700">
            {labels.viewFile}
          </a>
        ) : (
          "-"
        )}
      </td>
    </tr>
  );
}

function ExpenseCard({
  expense,
  fileUrl,
  labels,
  locale,
  statusLabels,
}: {
  expense: ExpenseDocument;
  fileUrl?: string;
  labels: ReturnType<typeof getDictionary>["pages"]["expenses"];
  locale: string;
  statusLabels: Record<ExpenseDocumentStatus, string>;
}) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-zinc-950">{expense.supplier_name}</h2>
          <p className="mt-1 text-sm text-zinc-500">{formatDate(expense.issue_date, locale)}</p>
        </div>
        <p className="font-semibold text-zinc-950">{money(expense.total_amount)}</p>
      </div>
      <dl className="mt-3 grid gap-2 text-sm">
        <Info label={labels.invoiceNumber} value={expense.invoice_number ?? "-"} />
        <Info label={labels.status} value={statusLabels[expense.status]} />
        <Info label={labels.category} value={expense.category ?? "-"} />
      </dl>
      {fileUrl ? (
        <a href={fileUrl} target="_blank" rel="noreferrer" className={buttonClass({ variant: "secondary", size: "full", className: "mt-4" })}>
          {labels.viewFile}
        </a>
      ) : null}
    </article>
  );
}

function Field({
  label,
  name,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "name"> & {
  label: string;
  name: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        name={name}
        className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        {...props}
      />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

async function signedUrlsByPath(supabase: Awaited<ReturnType<typeof createClient>>, expenses: ExpenseDocument[]) {
  const result = new Map<string, string>();

  await Promise.all(
    expenses.map(async (expense) => {
      const { data } = await supabase.storage.from("expense-documents").createSignedUrl(expense.file_url, 60 * 10);
      if (data?.signedUrl) {
        result.set(expense.file_url, data.signedUrl);
      }
    }),
  );

  return result;
}

function parseYear(value?: string) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 2000 && year <= 2200 ? year : new Date().getFullYear();
}

function parseQuarter(value?: string) {
  const quarter = Number(value);
  return Number.isInteger(quarter) && quarter >= 1 && quarter <= 4 ? quarter : null;
}

function dateRangeForFilter(year: number, quarter: number | null) {
  if (!quarter) {
    return { start: `${year}-01-01`, end: `${year + 1}-01-01` };
  }

  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 3;
  const endYear = endMonth > 12 ? year + 1 : year;
  const normalizedEndMonth = endMonth > 12 ? 1 : endMonth;

  return {
    start: `${year}-${String(startMonth).padStart(2, "0")}-01`,
    end: `${endYear}-${String(normalizedEndMonth).padStart(2, "0")}-01`,
  };
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale === "es" ? "es-ES" : "en-US");
}
