import { createCheckoutSessionAction, createCustomerPortalSessionAction } from "@/app/actions/billing";
import { buttonClass } from "@/components/button-styles";
import { Message } from "@/components/message";
import { getDictionary, getLocale } from "@/lib/i18n";
import {
  getEffectivePlan,
  getClientCount,
  getCurrentMonthDocumentCount,
  getPlanLimits,
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
  const effectivePlan = getEffectivePlan(profile);
  const hasPaidPlan = effectivePlan !== "starter";

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
        <PlanBadge plan={effectivePlan} freeLabel={t.pages.billing.freePlan} premiumLabel={t.pages.billing.premiumTitle} />
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
        <Metric label={t.pages.billing.monthlyBulk} value={limits.monthlyBulkInvoices ? t.common.included : "Premium"} />
        <Metric label={t.pages.billing.logoDocuments} value={limits.companyLogo ? t.common.included : "Pro"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          <PaidPlanCard
            name="Pro"
            price="7,90 EUR/mes + IVA"
            description={t.pricing.proDescription}
            features={[
              t.pricing.features.fifteenClients,
              t.pricing.features.fiftyDocuments,
              t.pricing.features.companyLogo,
            ]}
            plan="pro"
            disabled={effectivePlan === "pro" || effectivePlan === "premium" || effectivePlan === "enterprise"}
            cta={effectivePlan === "pro" ? t.pages.billing.currentPlan : t.pages.billing.choosePro}
          />
          <PaidPlanCard
            name="Premium"
            price="14,90 EUR/mes + IVA"
            description={t.pricing.premiumDescription}
            features={[
              t.pricing.features.unlimitedClients,
              t.pricing.features.unlimitedDocuments,
              t.pricing.features.companyLogo,
              t.pricing.features.bulkMonthly,
            ]}
            plan="premium"
            disabled={effectivePlan === "premium" || effectivePlan === "enterprise"}
            cta={effectivePlan === "premium" || effectivePlan === "enterprise" ? t.pages.billing.currentPlan : t.pages.billing.choosePremium}
            highlighted
          />
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-600">{t.pages.billing.currentStatus}</p>
          <p className="mt-1 text-lg font-semibold text-zinc-950">
            {hasPaidPlan ? `${getPlanLabel(effectivePlan, t.pages.billing.premiumTitle)} ${t.pages.billing.activeSuffix}` : t.pages.billing.freePlan}
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
            {hasPaidPlan && profile?.stripe_customer_id ? (
              <form action={createCustomerPortalSessionAction}>
                <button className={buttonClass({ variant: "primary", size: "full" })}>
                  {t.pages.billing.manageSubscription}
                </button>
              </form>
            ) : (
              <p className="text-sm text-zinc-500">{t.pages.billing.choosePlanHint}</p>
            )}
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

function PaidPlanCard({
  name,
  price,
  description,
  features,
  plan,
  cta,
  disabled,
  highlighted = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  plan: "pro" | "premium";
  cta: string;
  disabled: boolean;
  highlighted?: boolean;
}) {
  return (
    <article className={`rounded-lg border bg-white p-5 shadow-sm ${highlighted ? "border-blue-300" : "border-zinc-200"}`}>
      <h2 className="text-lg font-semibold text-zinc-950">{name}</h2>
      <p className="mt-3 text-2xl font-semibold leading-tight">{price}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
      <ul className="mt-4 space-y-2 text-sm text-zinc-700">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="text-emerald-600">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <form action={createCheckoutSessionAction} className="mt-5">
        <input type="hidden" name="plan" value={plan} />
        <button className={buttonClass({ variant: highlighted ? "primary" : "secondary", size: "full" })} disabled={disabled}>
          {cta}
        </button>
      </form>
    </article>
  );
}

function PlanBadge({
  plan,
  freeLabel,
  premiumLabel,
}: {
  plan: ReturnType<typeof getEffectivePlan>;
  freeLabel: string;
  premiumLabel: string;
}) {
  const isPaid = plan !== "starter";

  return (
    <span
      className={`inline-flex rounded-md border px-3 py-1.5 text-sm font-semibold ${
        isPaid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-white text-zinc-700"
      }`}
    >
      {plan === "starter" ? freeLabel : getPlanLabel(plan, premiumLabel)}
    </span>
  );
}

function getPlanLabel(plan: ReturnType<typeof getEffectivePlan>, premiumLabel: string) {
  if (plan === "pro") {
    return "Pro";
  }

  return premiumLabel;
}
