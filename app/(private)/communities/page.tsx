import Link from "next/link";
import { deleteCommunityAction } from "@/app/actions/communities";
import { buttonClass } from "@/components/button-styles";
import { ConfirmForm } from "@/components/confirm-form";
import { Message } from "@/components/message";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; message?: string }>;
}) {
  const user = await requireUser();
  const { q, message } = await searchParams;
  const supabase = await createClient();
  const search = (q ?? "").trim().replaceAll(",", " ");
  let query = supabase
    .from("communities")
    .select("*")
    .eq("owner_id", user.id)
    .order("name", { ascending: true });

  if (search) {
    query = query.or(`name.ilike.%${search}%,tax_id.ilike.%${search}%,city.ilike.%${search}%`);
  }

  const { data: communities, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Comunidades</h1>
          <p className="mt-1 text-sm text-zinc-600">Clientes y comunidades para facturar.</p>
        </div>
        <Link href="/communities/new" className={buttonClass({ variant: "primary" })}>
          Crear
        </Link>
      </div>
      <Message text={message ?? error?.message} />
      <form className="flex max-w-xl gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre, CIF o ciudad"
          className="h-10 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm"
        />
        <button className={buttonClass({ variant: "secondary" })}>Buscar</button>
      </form>

      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">CIF/NIF</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {communities?.length ? (
              communities.map((community) => (
                <tr key={community.id}>
                  <td className="px-4 py-3 font-medium">{community.name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{community.tax_id ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{community.city ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{community.email ?? community.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/communities/${community.id}/edit`} className={buttonClass({ variant: "warning", size: "sm" })}>
                        Editar
                      </Link>
                      <ConfirmForm
                        action={deleteCommunityAction}
                        id={community.id}
                        label="Eliminar"
                        message="¿Eliminar esta comunidad? También puede afectar a facturas relacionadas."
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-500">
                  No hay comunidades guardadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
