import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  await requireUser();
  const profile = await getCurrentProfile();

  if (!profile?.is_super_admin) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,email,role,plan,is_super_admin,has_lifetime_access,onboarding_completed_at,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">Usuarios registrados</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Vista de administración para revisar correos, roles y acceso premium de las cuentas.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left text-zinc-600">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Acceso total</th>
              <th className="px-4 py-3 font-medium">Onboarding</th>
              <th className="px-4 py-3 font-medium">Alta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(profiles ?? []).map((user) => (
              <tr key={user.id} className="align-top">
                <td className="px-4 py-3 text-zinc-900">{user.email ?? "Sin email"}</td>
                <td className="px-4 py-3 text-zinc-700">{user.role}</td>
                <td className="px-4 py-3 text-zinc-700">{user.plan}</td>
                <td className="px-4 py-3 text-zinc-700">
                  {user.is_super_admin || user.has_lifetime_access ? "Sí" : "No"}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {user.onboarding_completed_at ? "Completado" : "Pendiente"}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {new Date(user.created_at).toLocaleDateString("es-ES")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
