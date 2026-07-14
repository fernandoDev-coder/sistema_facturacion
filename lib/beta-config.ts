export const contactEmails = {
  legal: getPublicContactEmail("NEXT_PUBLIC_LEGAL_CONTACT_EMAIL"),
  privacy: getPublicContactEmail("NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL"),
  support: getPublicContactEmail("NEXT_PUBLIC_SUPPORT_CONTACT_EMAIL"),
} as const;

export const betaAccessHref = `mailto:${contactEmails.support}?subject=Solicitud%20de%20acceso%20beta%20FaktuDash`;

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

function getPublicContactEmail(key: string) {
  return process.env[key] || "contact@example.com";
}
