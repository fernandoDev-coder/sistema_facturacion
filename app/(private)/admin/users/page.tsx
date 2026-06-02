import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { ProfilePlan } from "@/lib/types";

type AdminUser = {
  id: string;
  email: string | null;
  full_name?: string | null;
  role: "user" | "admin" | "super_admin";
  plan: ProfilePlan;
  is_super_admin: boolean;
  has_lifetime_access: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
};

export default async function AdminUsersPage() {
  await requireUser();
  const profile = await getCurrentProfile();

  if (!profile?.is_super_admin) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const [profiles, { count: clientCount }, { count: documentCount }, { count: subscriptionCount }] = await Promise.all([
    getAdminUsers(supabase),
    supabase.from("communities").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }),
  ]);

  const users = profiles;
  const planCounts = getPlanCounts(users);
  const onboardingPending = users.filter((user) => !user.onboarding_completed_at).length;
  const lifetimeAccess = users.filter((user) => user.has_lifetime_access).length;
  const stripeCustomers = users.filter((user) => user.stripe_customer_id).length;
  const recentUsers = users.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-zinc-500">Administracion</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Panel del sistema</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-600">
          Resumen de usuarios, planes, suscripciones y actividad de billing. El borrado de usuarios no esta habilitado
          desde aqui porque puede eliminar clientes, facturas, presupuestos y configuracion asociados a la cuenta.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Usuarios" value={String(users.length)} hint={`${onboardingPending} con onboarding pendiente`} />
        <Metric label="Clientes" value={String(clientCount ?? 0)} hint="Total guardado en la base de datos" />
        <Metric label="Documentos" value={String(documentCount ?? 0)} hint="Facturas y presupuestos creados" />
        <Metric label="Suscripciones" value={String(subscriptionCount ?? 0)} hint={`${stripeCustomers} usuarios con Stripe`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">Planes</h2>
              <p className="text-sm text-zinc-500">Distribucion actual de acceso.</p>
            </div>
            <span className="text-sm text-zinc-500">{lifetimeAccess} con acceso vitalicio</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PlanMetric label="Gratis" value={planCounts.starter} />
            <PlanMetric label="Pro" value={planCounts.pro} />
            <PlanMetric label="Premium" value={planCounts.premium} />
            <PlanMetric label="Admin" value={planCounts.enterprise} />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">Ultimos usuarios</h2>
          <div className="mt-4 space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                <p className="truncate text-sm font-medium text-zinc-900">{user.email ?? "Sin email"}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {getPlanLabel(user.plan)} · {formatDate(user.created_at)}
                </p>
              </div>
            ))}
            {recentUsers.length === 0 ? <p className="text-sm text-zinc-500">No hay usuarios registrados.</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-950">Usuarios</h2>
          <p className="mt-1 text-sm text-zinc-500">Detalle de plan, rol, onboarding y datos de Stripe.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1160px] divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left text-zinc-600">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Acceso especial</th>
                <th className="px-4 py-3 font-medium">Suscripcion</th>
                <th className="px-4 py-3 font-medium">Onboarding</th>
                <th className="px-4 py-3 font-medium">Alta</th>
                <th className="px-4 py-3 font-medium">Stripe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => (
                <tr key={user.id} className="align-top">
                  <td className="max-w-[260px] px-4 py-3 text-zinc-900">
                    <p className="truncate font-medium">{user.email ?? "Sin email"}</p>
                    <p className="mt-1 font-mono text-xs text-zinc-400">{user.id}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{user.full_name ?? "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">{user.role}</td>
                  <td className="px-4 py-3 text-zinc-700">{getPlanLabel(user.plan)}</td>
                  <td className="px-4 py-3 text-zinc-700">{getSpecialAccessLabel(user)}</td>
                  <td className="px-4 py-3 text-zinc-700">
                    {user.subscription_status ? (
                      <div>
                        <p>{user.subscription_status}</p>
                        {user.subscription_current_period_end ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            hasta {formatDate(user.subscription_current_period_end)}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      "Sin suscripcion"
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {user.onboarding_completed_at ? "Completado" : "Pendiente"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{formatDate(user.created_at)}</td>
                  <td className="max-w-[220px] px-4 py-3 font-mono text-xs text-zinc-500">
                    {user.stripe_customer_id ? (
                      <div className="space-y-1">
                        <p className="truncate">{user.stripe_customer_id}</p>
                        {user.stripe_subscription_id ? <p className="truncate">{user.stripe_subscription_id}</p> : null}
                      </div>
                    ) : (
                      "No"
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-zinc-500">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-zinc-500">
        Los eventos de billing se consultan desde el servidor con service role; este panel evita depender de esa clave
        para no bloquear el acceso de administracion.
      </p>
    </div>
  );
}

async function getAdminUsers(supabase: Awaited<ReturnType<typeof createClient>>): Promise<AdminUser[]> {
  const withName = await supabase
    .from("profiles")
    .select(
      "id,email,full_name,role,plan,is_super_admin,has_lifetime_access,stripe_customer_id,stripe_subscription_id,subscription_status,subscription_current_period_end,onboarding_completed_at,created_at",
    )
    .order("created_at", { ascending: false });

  if (!withName.error) {
    return withName.data ?? [];
  }

  const withoutName = await supabase
    .from("profiles")
    .select(
      "id,email,role,plan,is_super_admin,has_lifetime_access,stripe_customer_id,stripe_subscription_id,subscription_status,subscription_current_period_end,onboarding_completed_at,created_at",
    )
    .order("created_at", { ascending: false });

  return (withoutName.data ?? []).map((user) => ({ ...user, full_name: null }));
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

function PlanMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-200 px-4 py-3">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function getPlanCounts(users: Array<{ plan: ProfilePlan }>): Record<ProfilePlan, number> {
  return users.reduce<Record<ProfilePlan, number>>(
    (counts, user) => {
      counts[user.plan] += 1;
      return counts;
    },
    { starter: 0, pro: 0, premium: 0, enterprise: 0 },
  );
}

function getPlanLabel(plan: ProfilePlan) {
  if (plan === "starter") {
    return "Gratis";
  }

  if (plan === "enterprise") {
    return "Admin";
  }

  return plan === "pro" ? "Pro" : "Premium";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES");
}

function getSpecialAccessLabel(user: { is_super_admin: boolean; has_lifetime_access: boolean }) {
  if (user.is_super_admin) {
    return "Administrador";
  }

  if (user.has_lifetime_access) {
    return "Premium vitalicio";
  }

  return "No";
}
