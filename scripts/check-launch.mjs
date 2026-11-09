import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const required = [
  "NEXT_PUBLIC_SUPPORT_CONTACT_EMAIL",
  "NEXT_PUBLIC_LEGAL_CONTACT_EMAIL",
  "NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL",
];
const invalid = required.filter((key) => {
  const email = process.env[key]?.trim() ?? "";
  return !/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email) || /@example\.(com|org|net)$/i.test(email);
});
if (invalid.length) {
  console.error(`Configuración de contacto pendiente: ${invalid.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("Contacto público: las tres variables son válidas.");
}
