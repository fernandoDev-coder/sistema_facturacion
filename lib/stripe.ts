import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Falta STRIPE_SECRET_KEY.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}

export function getStripeProPriceId() {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!priceId) {
    throw new Error("Falta STRIPE_PRO_PRICE_ID.");
  }

  return priceId;
}

export function getStripePremiumPriceId() {
  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;

  if (!priceId) {
    throw new Error("Falta STRIPE_PREMIUM_PRICE_ID.");
  }

  return priceId;
}

export function getStripePriceId(plan: "pro" | "premium") {
  return plan === "premium" ? getStripePremiumPriceId() : getStripeProPriceId();
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
