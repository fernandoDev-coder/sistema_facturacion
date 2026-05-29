import Link from "next/link";
import { deleteClientAction } from "@/app/actions/clients";
import { buttonClass } from "@/components/button-styles";
import { ConfirmForm } from "@/components/confirm-form";
import { Message } from "@/components/message";
import { getDictionary, getLocale } from "@/lib/i18n";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { Community } from "@/lib/types";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; message?: string }>;
}) {
  const user = await requireUser();
  const { q, message } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();
  const search = (q ?? "").trim().replaceAll(",", " ");
  const { clients, errorMessage } = await getClients(supabase, user.id, search);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.pages.clients.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t.pages.clients.description}</p>
        </div>
        <Link href="/clients/new" className={buttonClass({ variant: "primary" })}>
          {t.common.create}
        </Link>
      </div>
      <Message text={message ?? errorMessage} />
      <form className="flex max-w-xl gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder={t.pages.clients.searchPlaceholder}
          className="h-10 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm"
        />
        <button className={buttonClass({ variant: "secondary" })}>{t.common.search}</button>
      </form>

      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">{t.pages.clients.name}</th>
              <th className="px-4 py-3">{t.pages.clients.taxId}</th>
              <th className="px-4 py-3">{t.pages.clients.city}</th>
              <th className="px-4 py-3">{t.pages.clients.contact}</th>
              <th className="px-4 py-3 text-right">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {clients?.length ? (
              clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-3 font-medium">{client.name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{client.tax_id ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{client.city ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{client.email ?? client.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/clients/${client.id}/edit`} className={buttonClass({ variant: "warning", size: "sm" })}>
                        {t.common.edit}
                      </Link>
                      <ConfirmForm
                        action={deleteClientAction}
                        id={client.id}
                        label={t.common.delete}
                        message={t.pages.clients.deleteConfirm}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-500">
                  {t.pages.clients.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function getClients(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  search: string,
) {
  const baseQuery = () =>
    supabase
      .from("communities")
      .select("*")
      .eq("owner_id", ownerId);

  if (!search) {
    const { data, error } = await baseQuery().order("name", { ascending: true });
    return { clients: data ?? [], errorMessage: error?.message };
  }

  const pattern = `%${escapeLikePattern(search)}%`;
  const results = await Promise.all([
    baseQuery().ilike("name", pattern),
    baseQuery().ilike("tax_id", pattern),
    baseQuery().ilike("city", pattern),
  ]);
  const error = results.find((result) => result.error)?.error;
  const clientsById = new Map<string, Community>();

  for (const result of results) {
    for (const client of result.data ?? []) {
      clientsById.set(client.id, client);
    }
  }

  return {
    clients: Array.from(clientsById.values()).sort((a, b) => a.name.localeCompare(b.name, "es")),
    errorMessage: error?.message,
  };
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}
