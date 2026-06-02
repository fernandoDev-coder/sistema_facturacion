"use server";

import { redirect } from "next/navigation";
import {
  arePaymentsEnabled,
  getPaymentUnavailableMessage,
  isBetaMode,
  isStripeLiveEnabled,
} from "@/lib/beta-config";
import { getEffectivePlan } from "@/lib/plan-limits";
import { getSiteUrl, getStripe, getStripePriceId } from "@/lib/stripe";
import { createAdminClient, createClient, requireUser } from "@/lib/supabase/server";

function billingRedirect(message: string): never {
  redirect(`/settings/billing?message=${encodeURIComponent(message)}`);
}

export async function createCheckoutSessionAction(formData?: FormData) {
  if (isBetaMode() || !arePaymentsEnabled()) {
    billingRedirect(getPaymentUnavailableMessage());
  }

  const user = await requireUser();
  const selectedPlan = parseCheckoutPlan(formData);
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id,email,plan,has_lifetime_access,is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  const currentPlan = getEffectivePlan(profile);

  if (currentPlan === "enterprise" || currentPlan === "premium" || (currentPlan === "pro" && selectedPlan === "pro")) {
    billingRedirect(`Tu cuenta ya tiene acceso ${getPlanName(currentPlan)}.`);
  }

  let checkoutUrl: string | null = null;

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
    if (!isStripeLiveEnabled() && secretKey.startsWith("sk_live_")) {
      billingRedirect(getPaymentUnavailableMessage());
    }

    const stripe = getStripe();
    const admin = createAdminClient();
    let customerId = profile?.stripe_customer_id ?? null;

    if (currentPlan === "pro" && selectedPlan === "premium" && customerId) {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${getSiteUrl()}/settings/billing`,
      });

      checkoutUrl = session.url;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email ?? undefined,
        metadata: {
          owner_id: user.id,
        },
      });
      customerId = customer.id;

      await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    if (!checkoutUrl) {
      const siteUrl = getSiteUrl();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: user.id,
        line_items: [{ price: getStripePriceId(selectedPlan), quantity: 1 }],
        success_url: `${siteUrl}/settings/billing?message=${encodeURIComponent("Pago completado. Activaremos tu plan en cuanto Stripe confirme la suscripcion.")}`,
        cancel_url: `${siteUrl}/settings/billing?message=${encodeURIComponent("Pago cancelado. No se ha cambiado tu plan.")}`,
        metadata: {
          owner_id: user.id,
          plan: selectedPlan,
        },
        subscription_data: {
          metadata: {
            owner_id: user.id,
            plan: selectedPlan,
          },
        },
      });

      checkoutUrl = session.url;
    }
  } catch (error) {
    billingRedirect((error as Error).message);
  }

  if (!checkoutUrl) {
    billingRedirect("Stripe no devolvio una URL de pago.");
  }

  redirect(checkoutUrl);
}

function parseCheckoutPlan(formData?: FormData) {
  const plan = formData?.get("plan");
  return plan === "premium" ? "premium" : "pro";
}

function getPlanName(plan: ReturnType<typeof getEffectivePlan>) {
  if (plan === "premium") {
    return "Premium";
  }

  if (plan === "enterprise") {
    return "Premium";
  }

  return "Pro";
}

export async function createCustomerPortalSessionAction() {
  if (isBetaMode() || !arePaymentsEnabled()) {
    billingRedirect(getPaymentUnavailableMessage());
  }

  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    billingRedirect("Aun no hay una suscripcion de Stripe asociada a esta cuenta.");
  }

  let portalUrl: string | null = null;

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getSiteUrl()}/settings/billing`,
    });

    portalUrl = session.url;
  } catch (error) {
    billingRedirect((error as Error).message);
  }

  redirect(portalUrl);
}
