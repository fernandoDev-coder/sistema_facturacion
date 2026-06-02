export const contactEmails = {
  legal: "faktudash@gmail.com",
  privacy: "faktudash@gmail.com",
  support: "faktudash@gmail.com",
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
