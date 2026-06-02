import { redirect } from "next/navigation";
import { getDictionary, getLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { ProfilePlan } from "@/lib/types";

type AdminLabels = ReturnType<typeof getDictionary>["pages"]["admin"];

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

  const locale = await getLocale();
  const t = getDictionary(locale).pages.admin;
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
        <p className="text-sm font-medium text-zinc-500">{t.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-950">{t.title}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-600">{t.description}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t.users} value={String(users.length)} hint={`${onboardingPending} ${t.usersHint}`} />
        <Metric label={t.clients} value={String(clientCount ?? 0)} hint={t.clientsHint} />
        <Metric label={t.documents} value={String(documentCount ?? 0)} hint={t.documentsHint} />
        <Metric label={t.subscriptions} value={String(subscriptionCount ?? 0)} hint={`${stripeCustomers} ${t.stripeUsersHint}`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">{t.plans}</h2>
              <p className="text-sm text-zinc-500">{t.plansDescription}</p>
            </div>
            <span className="text-sm text-zinc-500">
              {lifetimeAccess} {t.lifetimeAccess}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PlanMetric label={t.freePlan} value={planCounts.starter} />
            <PlanMetric label="Pro" value={planCounts.pro} />
            <PlanMetric label="Premium" value={planCounts.premium} />
            <PlanMetric label={t.adminPlan} value={planCounts.enterprise} />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">{t.recentUsers}</h2>
          <div className="mt-4 space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                <p className="truncate text-sm font-medium text-zinc-900">{user.email ?? t.noEmail}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {getPlanLabel(user.plan, t)} · {formatDate(user.created_at, locale)}
                </p>
              </div>
            ))}
            {recentUsers.length === 0 ? <p className="text-sm text-zinc-500">{t.noUsers}</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-950">{t.users}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t.usersTableDescription}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1160px] divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left text-zinc-600">
                <th className="px-4 py-3 font-medium">{t.email}</th>
                <th className="px-4 py-3 font-medium">{t.name}</th>
                <th className="px-4 py-3 font-medium">{t.role}</th>
                <th className="px-4 py-3 font-medium">{t.plan}</th>
                <th className="px-4 py-3 font-medium">{t.specialAccess}</th>
                <th className="px-4 py-3 font-medium">{t.subscription}</th>
                <th className="px-4 py-3 font-medium">{t.onboarding}</th>
                <th className="px-4 py-3 font-medium">{t.createdAt}</th>
                <th className="px-4 py-3 font-medium">Stripe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => (
                <tr key={user.id} className="align-top">
                  <td className="max-w-[260px] px-4 py-3 text-zinc-900">
                    <p className="truncate font-medium">{user.email ?? t.noEmail}</p>
                    <p className="mt-1 font-mono text-xs text-zinc-400">{user.id}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{user.full_name ?? "-"}</td>
                  <td className="px-4 py-3 text-zinc-700">{user.role}</td>
                  <td className="px-4 py-3 text-zinc-700">{getPlanLabel(user.plan, t)}</td>
                  <td className="px-4 py-3 text-zinc-700">{getSpecialAccessLabel(user, t)}</td>
                  <td className="px-4 py-3 text-zinc-700">
                    {user.subscription_status ? (
                      <div>
                        <p>{user.subscription_status}</p>
                        {user.subscription_current_period_end ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            {t.until} {formatDate(user.subscription_current_period_end, locale)}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      t.noSubscription
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {user.onboarding_completed_at ? t.completed : t.pending}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{formatDate(user.created_at, locale)}</td>
                  <td className="max-w-[220px] px-4 py-3 font-mono text-xs text-zinc-500">
                    {user.stripe_customer_id ? (
                      <div className="space-y-1">
                        <p className="truncate">{user.stripe_customer_id}</p>
                        {user.stripe_subscription_id ? <p className="truncate">{user.stripe_subscription_id}</p> : null}
                      </div>
                    ) : (
                      t.no
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-zinc-500">
                    {t.noUsers}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-zinc-500">{t.serviceRoleNote}</p>
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

function getPlanLabel(plan: ProfilePlan, labels: Pick<AdminLabels, "freePlan" | "adminPlan">) {
  if (plan === "starter") {
    return labels.freePlan;
  }

  if (plan === "enterprise") {
    return labels.adminPlan;
  }

  return plan === "pro" ? "Pro" : "Premium";
}

function formatDate(value: string, locale: Locale) {
  return new Date(value).toLocaleDateString(locale === "es" ? "es-ES" : "en-US");
}

function getSpecialAccessLabel(
  user: { is_super_admin: boolean; has_lifetime_access: boolean },
  labels: Pick<AdminLabels, "administrator" | "lifetimePremium" | "no">,
) {
  if (user.is_super_admin) {
    return labels.administrator;
  }

  if (user.has_lifetime_access) {
    return labels.lifetimePremium;
  }

  return labels.no;
}
