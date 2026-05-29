import { createCheckoutSessionAction, createCustomerPortalSessionAction } from "@/app/actions/billing";
import { buttonClass } from "@/components/button-styles";
import { Message } from "@/components/message";
import { getDictionary, getLocale } from "@/lib/i18n";
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
  const locale = await getLocale();
  const t = getDictionary(locale);
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
          <h1 className="text-2xl font-semibold">{t.pages.billing.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t.pages.billing.description}</p>
        </div>
        <PlanBadge isPro={isPro} label={profile?.plan ?? "starter"} />
      </div>

      <Message text={message} />

      <section className="grid gap-4 lg:grid-cols-4">
        <Metric
          label={t.common.clients}
          value={`${clients}${limits.clients === null ? "" : ` / ${limits.clients}`}`}
        />
        <Metric
          label={t.pages.billing.documentsThisMonth}
          value={`${documentsThisMonth}${limits.documentsPerMonth === null ? "" : ` / ${limits.documentsPerMonth}`}`}
        />
        <Metric label={t.pages.billing.monthlyBulk} value={limits.monthlyBulkInvoices ? t.common.included : "Pro"} />
        <Metric label={t.pages.billing.logoDocuments} value={limits.companyLogo ? t.common.included : "Pro"} />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">{t.pages.billing.proTitle}</h2>
            <p className="mt-2 text-sm text-zinc-600">{t.pages.billing.proDescription}</p>
            <div className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
              <p>{t.pages.billing.unlimitedClients}</p>
              <p>{t.pages.billing.unlimitedDocuments}</p>
              <p>{t.pages.billing.monthlyBulkIncluded}</p>
              <p>{t.pages.billing.logoIncluded}</p>
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-600">{t.pages.billing.currentStatus}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-950">
              {isPro ? t.pages.billing.proActive : t.pages.billing.freePlan}
            </p>
            {subscription ? (
              <p className="mt-2 text-xs text-zinc-500">
                Stripe: {subscription.status}
                {subscription.current_period_end
                  ? ` ${t.pages.billing.until} ${new Date(subscription.current_period_end).toLocaleDateString(locale === "es" ? "es-ES" : "en-US")}`
                  : ""}
              </p>
            ) : null}
            <div className="mt-4">
              {isPro && profile?.stripe_customer_id ? (
                <form action={createCustomerPortalSessionAction}>
                  <button className={buttonClass({ variant: "primary", size: "full" })}>
                    {t.pages.billing.manageSubscription}
                  </button>
                </form>
              ) : (
                <form action={createCheckoutSessionAction}>
                  <button className={buttonClass({ variant: "primary", size: "full" })}>
                    {t.pages.billing.upgrade}
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
