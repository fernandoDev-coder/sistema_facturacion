import { createCheckoutSessionAction, createCustomerPortalSessionAction } from "@/app/actions/billing";
import { buttonClass } from "@/components/button-styles";
import { Message } from "@/components/message";
import {
  getClientCount,
  getCurrentMonthDocumentCount,
  getPlanLimits,
  hasPaidAccess,
} from "@/lib/plan-limits";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const { message } = await searchParams;
  const supabase = await createClient();
  const limits = getPlanLimits(profile);
  const isPro = hasPaidAccess(profile);

  const [{ data: subscription }, clients, documentsThisMonth] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getClientCount(supabase, user.id),
    getCurrentMonthDocumentCount(supabase, user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Plan y facturacion</h1>
          <p className="mt-1 text-sm text-zinc-600">Gestiona el acceso Pro y los limites de uso de tu cuenta.</p>
        </div>
        <PlanBadge isPro={isPro} label={profile?.plan ?? "starter"} />
      </div>

      <Message text={message} />

      <section className="grid gap-4 lg:grid-cols-3">
        <Metric
          label="Clientes"
          value={`${clients}${limits.clients === null ? "" : ` / ${limits.clients}`}`}
        />
        <Metric
          label="Documentos este mes"
          value={`${documentsThisMonth}${limits.documentsPerMonth === null ? "" : ` / ${limits.documentsPerMonth}`}`}
        />
        <Metric label="Facturacion mensual masiva" value={limits.monthlyBulkInvoices ? "Incluida" : "Pro"} />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Plan Pro</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Clientes y documentos sin limite operativo, facturacion mensual masiva y acceso a mejoras premium.
            </p>
            <div className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
              <p>Clientes ilimitados</p>
              <p>Documentos ilimitados</p>
              <p>Facturacion mensual masiva</p>
              <p>Gestion desde portal Stripe</p>
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-600">Estado actual</p>
            <p className="mt-1 text-lg font-semibold text-zinc-950">
              {isPro ? "Acceso Pro activo" : "Plan gratis"}
            </p>
            {subscription ? (
              <p className="mt-2 text-xs text-zinc-500">
                Stripe: {subscription.status}
                {subscription.current_period_end
                  ? ` hasta ${new Date(subscription.current_period_end).toLocaleDateString("es-ES")}`
                  : ""}
              </p>
            ) : null}
            <div className="mt-4">
              {isPro && profile?.stripe_customer_id ? (
                <form action={createCustomerPortalSessionAction}>
                  <button className={buttonClass({ variant: "primary", size: "full" })}>
                    Gestionar suscripcion
                  </button>
                </form>
              ) : (
                <form action={createCheckoutSessionAction}>
                  <button className={buttonClass({ variant: "primary", size: "full" })}>
                    Mejorar a Pro
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function PlanBadge({ isPro, label }: { isPro: boolean; label: string }) {
  return (
    <span
      className={`inline-flex rounded-md border px-3 py-1.5 text-sm font-semibold ${
        isPro ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-white text-zinc-700"
      }`}
    >
      {isPro ? "Pro" : label}
    </span>
  );
}
