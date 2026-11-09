export const contactEmails = {
  legal: getPublicContactEmail(process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL),
  privacy: getPublicContactEmail(process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL),
  support: getPublicContactEmail(process.env.NEXT_PUBLIC_SUPPORT_CONTACT_EMAIL),
} as const;

export function contactHref(email: string, subject = "FaktuDash") {
  return email ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : "/contact";
}

export const betaAccessHref = contactHref(contactEmails.support, "Solicitud de acceso beta FaktuDash");

export function isBetaMode() {
  return process.env.BETA_MODE !== "false";
}

export function arePaymentsEnabled() {
  return process.env.PAYMENTS_ENABLED === "true";
}

export function isStripeLiveEnabled() {
  return process.env.STRIPE_LIVE_ENABLED === "true";
}

export function getPaymentUnavailableMessage() {
  return "Los pagos todavia no estan disponibles durante la beta privada.";
}

function getPublicContactEmail(value: string | undefined) {
  const email = value?.trim() ?? "";
  return /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email) ? email : "";
}
