import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import type { ProfilePlan } from "@/lib/types";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Firma de Stripe invalida." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: eventError } = await admin.from("billing_events").insert({
    event_id: event.id,
    type: event.type,
    payload: event as unknown,
  });

  if (eventError?.code === "23505") {
    const { data: storedEvent } = await admin
      .from("billing_events")
      .select("processed_at")
      .eq("event_id", event.id)
      .maybeSingle();

    if (storedEvent?.processed_at) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  if (eventError && eventError.code !== "23505") {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscription(subscription, session.client_reference_id ?? session.metadata?.owner_id ?? null);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription, null);
        break;
      }
    }
  } catch (error) {
    await admin
      .from("billing_events")
      .update({ processing_error: (error as Error).message })
      .eq("event_id", event.id);

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  await admin
    .from("billing_events")
    .update({ processed_at: new Date().toISOString(), processing_error: null })
    .eq("event_id", event.id);

  return NextResponse.json({ received: true });
}

async function syncSubscription(subscription: Stripe.Subscription, fallbackOwnerId: string | null) {
  const admin = createAdminClient();
  const customerId = getCustomerId(subscription.customer);
  const ownerId = subscription.metadata.owner_id || fallbackOwnerId || (await findOwnerByCustomerId(customerId));

  if (!ownerId) {
    throw new Error(`No se pudo resolver el usuario de la suscripcion ${subscription.id}.`);
  }

  const firstItem = subscription.items.data[0];
  const currentPeriodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : null;
  const priceId = firstItem?.price.id ?? null;
  const status = subscription.status;
  const subscriptionPlan = getSubscriptionPlan(subscription);
  const paidPlan = isActiveSubscription(status) ? subscriptionPlan : "starter";

  await admin.from("subscriptions").upsert(
    {
      owner_id: ownerId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan: subscriptionPlan,
      status,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "stripe_subscription_id" },
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("plan,is_super_admin,has_lifetime_access")
    .eq("id", ownerId)
    .maybeSingle();

  const nextPlan: ProfilePlan =
    profile?.is_super_admin || profile?.has_lifetime_access ? profile.plan : paidPlan;

  await admin
    .from("profiles")
    .update({
      plan: nextPlan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: status,
      subscription_current_period_end: currentPeriodEnd,
    })
    .eq("id", ownerId);
}

async function findOwnerByCustomerId(customerId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data?.id ?? null;
}

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer) {
  return typeof customer === "string" ? customer : customer.id;
}

function isActiveSubscription(status: string) {
  return status === "active" || status === "trialing";
}

function getSubscriptionPlan(subscription: Stripe.Subscription): Exclude<ProfilePlan, "starter"> {
  return subscription.metadata.plan === "premium" ? "premium" : "pro";
}
