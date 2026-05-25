"use server";

import { redirect } from "next/navigation";
import { hasPaidAccess } from "@/lib/plan-limits";
import { getSiteUrl, getStripe, getStripeProPriceId } from "@/lib/stripe";
import { createAdminClient, createClient, requireUser } from "@/lib/supabase/server";

function billingRedirect(message: string): never {
  redirect(`/settings/billing?message=${encodeURIComponent(message)}`);
}

export async function createCheckoutSessionAction() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id,email,plan,has_lifetime_access,is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (hasPaidAccess(profile)) {
    billingRedirect("Tu cuenta ya tiene acceso Pro.");
  }

  let checkoutUrl: string | null = null;

  try {
    const stripe = getStripe();
    const admin = createAdminClient();
    let customerId = profile?.stripe_customer_id ?? null;

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

    const siteUrl = getSiteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: getStripeProPriceId(), quantity: 1 }],
      success_url: `${siteUrl}/settings/billing?message=${encodeURIComponent("Pago completado. Activaremos tu plan en cuanto Stripe confirme la suscripcion.")}`,
      cancel_url: `${siteUrl}/settings/billing?message=${encodeURIComponent("Pago cancelado. No se ha cambiado tu plan.")}`,
      metadata: {
        owner_id: user.id,
        plan: "pro",
      },
      subscription_data: {
        metadata: {
          owner_id: user.id,
          plan: "pro",
        },
      },
    });

    checkoutUrl = session.url;
  } catch (error) {
    billingRedirect((error as Error).message);
  }

  if (!checkoutUrl) {
    billingRedirect("Stripe no devolvio una URL de pago.");
  }

  redirect(checkoutUrl);
}

export async function createCustomerPortalSessionAction() {
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
