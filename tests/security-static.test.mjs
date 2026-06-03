import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readProjectFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("client search avoids raw PostgREST OR filter interpolation", () => {
  const clientsPage = readProjectFile("app/(private)/clients/page.tsx");

  assert.equal(clientsPage.includes(".or("), false);
  assert.match(clientsPage, /\.ilike\("name", pattern\)/);
  assert.match(clientsPage, /\.ilike\("tax_id", pattern\)/);
  assert.match(clientsPage, /\.ilike\("city", pattern\)/);
});

test("server actions verify owned-row mutations before continuing", () => {
  const clientActions = readProjectFile("app/actions/clients.ts");
  const invoiceActions = readProjectFile("app/actions/invoices.ts");
  const mutationChecks = [...clientActions.matchAll(/\.select\("id"\)\s*\.maybeSingle\(\)/g)].length
    + [...invoiceActions.matchAll(/\.select\("id"\)\s*\.maybeSingle\(\)/g)].length;

  assert.ok(mutationChecks >= 4);
  assert.match(invoiceActions, /safeDocumentRedirectPath/);
  assert.match(invoiceActions, /Documento no encontrado/);
  assert.match(invoiceActions, /existingInvoice\.document_type === "invoice" && existingInvoice\.status !== "draft"/);
  assert.match(invoiceActions, /existingDocument\.status !== "draft"/);
  assert.match(clientActions, /Cliente no encontrado/);
});

test("RLS policies tie invoice relationships to the authenticated owner", () => {
  const schema = readProjectFile("supabase/schema.sql");

  assert.match(schema, /where communities\.id = invoices\.community_id\s+and communities\.owner_id = auth\.uid\(\)/);
  assert.match(schema, /where invoices\.id = invoice_items\.invoice_id\s+and invoices\.owner_id = auth\.uid\(\)/);
});

test("dependency policy pins patched Next and overrides vulnerable PostCSS", () => {
  const packageJson = JSON.parse(readProjectFile("package.json"));

  assert.equal(packageJson.dependencies.next, "16.2.6");
  assert.equal(packageJson.devDependencies["eslint-config-next"], "16.2.6");
  assert.equal(packageJson.overrides.postcss, "8.5.13");
});

test("registration keeps the email after password validation errors", () => {
  const authActions = readProjectFile("app/actions/auth.ts");
  const registerPage = readProjectFile("app/(auth)/register/page.tsx");

  assert.match(authActions, /function registerRedirect\(message: string, email: string\)/);
  assert.match(authActions, /registerRedirect\(passwordError, email\)/);
  assert.match(authActions, /registerRedirect\("Las contraseñas no coinciden\.", email\)/);
  assert.match(registerPage, /searchParams: Promise<\{ message\?: string; email\?: string \}>/);
  assert.match(registerPage, /defaultValue=\{email\}/);
});

test("special account access is pinned to the requested emails", () => {
  const profiles = readProjectFile("lib/profiles.ts");

  assert.match(profiles, /const systemAdminEmail = "fernandolaramillan@gmail\.com"/);
  assert.match(profiles, /const complimentaryPremiumEmail = "jandry38@hotmail\.es"/);
  assert.match(profiles, /return \[systemAdminEmail\]/);
  assert.doesNotMatch(profiles, /SUPER_ADMIN_EMAILS/);
  assert.match(profiles, /plan: "premium"/);
  assert.match(profiles, /has_lifetime_access: true/);
});

test("self-service account deletion requires confirmation and blocks admins", () => {
  const accountAction = readProjectFile("app/actions/account.ts");
  const accountPage = readProjectFile("app/(private)/settings/account/page.tsx");
  const schema = readProjectFile("supabase/schema.sql");
  const types = readProjectFile("lib/types.ts");

  assert.match(accountAction, /export async function saveAccountProfileAction/);
  assert.match(accountAction, /full_name: fullName \|\| null/);
  assert.match(accountAction, /export async function changePasswordAction/);
  assert.match(accountAction, /validatePassword\(newPassword\)/);
  assert.match(accountAction, /confirmationEmail !== userEmail/);
  assert.match(accountAction, /profile\?\.is_super_admin/);
  assert.match(accountAction, /subscriptions\.cancel\(profile\.stripe_subscription_id\)/);
  assert.match(accountAction, /auth\.admin\.deleteUser\(user\.id\)/);
  assert.match(schema, /alter table public\.profiles add column if not exists full_name text/);
  assert.match(types, /full_name: string \| null/);
  assert.match(accountPage, /name="full_name"/);
  assert.match(accountPage, /name="confirm_email"/);
  assert.match(accountPage, /account\.deleteAccount/);
});

test("admin panel uses localized dictionary labels", () => {
  const adminPage = readProjectFile("app/(private)/admin/users/page.tsx");
  const i18n = readProjectFile("lib/i18n.ts");

  assert.match(adminPage, /getDictionary\(locale\)\.pages\.admin/);
  assert.match(adminPage, /t\.description/);
  assert.match(adminPage, /t\.serviceRoleNote/);
  assert.doesNotMatch(adminPage, /Panel del sistema|Ultimos usuarios|No hay usuarios registrados/);
  assert.match(i18n, /title: "System panel"/);
});

test("public SEO files expose only crawlable marketing pages", () => {
  const layout = readProjectFile("app/layout.tsx");
  const robots = readProjectFile("app/robots.ts");
  const sitemap = readProjectFile("app/sitemap.ts");
  const siteUrl = readProjectFile("lib/site-url.ts");
  const privateLayout = readProjectFile("app/(private)/layout.tsx");
  const authLayout = readProjectFile("app/(auth)/layout.tsx");

  assert.match(layout, /metadataBase: getSiteUrl\(\)/);
  assert.match(layout, /Facturación mensual para autónomos/);
  assert.match(siteUrl, /const defaultSiteUrl = "https:\/\/www\.faktudash\.com"/);
  assert.match(siteUrl, /configuredUrl\.includes\("localhost"\)/);
  assert.match(robots, /disallow: \[/);
  assert.match(robots, /"\/admin\/"/);
  assert.match(robots, /getAbsoluteUrl\("\/sitemap\.xml"\)/);
  assert.match(sitemap, /path: "\/pricing"/);
  assert.doesNotMatch(sitemap, /\/dashboard|\/admin|\/settings/);
  assert.match(privateLayout, /index: false/);
  assert.match(authLayout, /index: false/);
});

test("demo seed script only clears marked screenshot data", () => {
  const seedDemo = readProjectFile("scripts/seed-demo-data.mjs");
  const packageJson = JSON.parse(readProjectFile("package.json"));

  assert.equal(packageJson.scripts["seed:demo-data"], "node scripts/seed-demo-data.mjs");
  assert.match(seedDemo, /const DEMO_MARKER = "DEMO_SCREENSHOT_SEED"/);
  assert.match(seedDemo, /\.eq\("notes", DEMO_MARKER\)/);
  assert.match(seedDemo, /SEED_PRO_USER_EMAIL/);
  assert.match(seedDemo, /document_type: "budget"/);
  assert.match(seedDemo, /document_type: "invoice"/);
});

test("company logo URLs are normalized and protocol-validated before storing", () => {
  const validators = readProjectFile("lib/validators.ts");
  const companyAction = readProjectFile("app/actions/company.ts");

  assert.match(validators, /export function cleanLogoUrl/);
  assert.match(validators, /\["http:", "https:"\]\.includes\(parsed\.protocol\)/);
  assert.match(validators, /"mediaurl", "imgurl", "cdnurl"/);
  assert.match(companyAction, /cleanLogoUrl\(nullableText\(formData\.get\("logo_url"\)\)\)/);
  assert.match(companyAction, /if \(limits\.companyLogo\) {\s+fields\.push\(\["logo_url", logoUrl\]\)/);
  assert.match(companyAction, /logo_url: limits\.companyLogo \? uploadedLogoUrl \?\? logoUrl\.value : existingCompany\?\.logo_url \?\? null/);
});

test("company logo uploads are size-limited and stored in a user-scoped bucket", () => {
  const companyAction = readProjectFile("app/actions/company.ts");
  const settingsPage = readProjectFile("app/(private)/settings/company/page.tsx");
  const schema = readProjectFile("supabase/schema.sql");
  const nextConfig = readProjectFile("next.config.ts");

  assert.match(companyAction, /const LOGO_BUCKET = "company-logos"/);
  assert.match(companyAction, /const MAX_LOGO_BYTES = 2 \* 1024 \* 1024/);
  assert.match(companyAction, /"image\/png": "png"/);
  assert.match(companyAction, /"image\/jpeg": "jpg"/);
  assert.match(companyAction, /"image\/webp": "webp"/);
  assert.match(companyAction, /storage\.upload\(objectPath, Buffer\.from\(await value\.arrayBuffer\(\)\)/);
  assert.match(settingsPage, /encType="multipart\/form-data"/);
  assert.match(settingsPage, /name="logo_file"/);
  assert.match(schema, /insert into storage\.buckets \(id, name, public, file_size_limit, allowed_mime_types\)/);
  assert.match(schema, /\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
  assert.match(nextConfig, /bodySizeLimit: "3mb"/);
});

test("invoice CSV export is plan-gated and owner-scoped", () => {
  const exportRoute = readProjectFile("app/api/export/invoices.csv/route.ts");
  const invoicesPage = readProjectFile("app/(private)/invoices/page.tsx");
  const planLimits = readProjectFile("lib/plan-limits.ts");

  assert.match(planLimits, /csvExport: false/);
  assert.match(planLimits, /export function canExportInvoices/);
  assert.match(exportRoute, /supabase\.auth\.getUser\(\)/);
  assert.match(exportRoute, /canExportInvoices\(profile\)/);
  assert.match(exportRoute, /\.eq\("owner_id", user\.id\)/);
  assert.match(exportRoute, /daysBetween\(from, to\) > maxExportRangeDays/);
  assert.match(exportRoute, /\^\[=\+\\-@\\t\]/);
  assert.match(exportRoute, /Content-Type": "text\/csv; charset=utf-8"/);
  assert.match(exportRoute, /Content-Disposition/);
  assert.match(invoicesPage, /action="\/api\/export\/invoices\.csv"/);
  assert.match(invoicesPage, /t\.pages\.invoices\.exportUnavailable/);
});

test("invoice lifecycle is aligned with internal fiscal traceability", () => {
  const invoiceActions = readProjectFile("app/actions/invoices.ts");
  const invoiceForm = readProjectFile("components/invoice-form.tsx");
  const invoicesPage = readProjectFile("app/(private)/invoices/page.tsx");
  const editInvoicePage = readProjectFile("app/(private)/invoices/[id]/edit/page.tsx");
  const schema = readProjectFile("supabase/schema.sql");
  const migration = readProjectFile("supabase/migrations/20260603093000_verifactu_architecture_alignment.sql");
  const types = readProjectFile("lib/types.ts");

  assert.match(types, /export type InvoiceStatus = "draft" \| "issued" \| "cancelled" \| "corrective"/);
  assert.match(schema, /create table if not exists public\.fiscal_records/);
  assert.match(schema, /create table if not exists public\.audit_logs/);
  assert.match(schema, /invoices_owner_issued_number_key/);
  assert.match(migration, /create or replace function public\.issue_invoice\(p_invoice_id uuid\)/);
  assert.match(migration, /create or replace function public\.cancel_invoice\(p_invoice_id uuid, p_reason text\)/);
  assert.match(migration, /record_type', 'alta'/);
  assert.match(migration, /record_type', 'anulacion'/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /previous_record_id/);
  assert.match(migration, /chain_sequence/);
  assert.match(invoiceActions, /export async function issueInvoice\(invoiceId: string, userId: string\)/);
  assert.match(invoiceActions, /export async function cancelInvoice\(invoiceId: string, userId: string, reason: string\)/);
  assert.match(invoiceActions, /existingInvoice\.status !== "draft"/);
  assert.match(invoiceActions, /existingDocument\.status !== "draft"/);
  assert.match(invoiceActions, /invoice_created/);
  assert.match(invoiceActions, /invoice_updated/);
  assert.match(invoicesPage, /Emitir factura/);
  assert.match(invoicesPage, /Anular factura/);
  assert.match(invoicesPage, /Esta factura ya ha sido emitida y no puede modificarse directamente/);
  assert.match(editInvoicePage, /invoice\.status !== "draft"/);
  assert.match(invoiceForm, /name="status" value="draft"/);
});

test("CSV export and audit logs include fiscal fields without mutating invoices", () => {
  const exportRoute = readProjectFile("app/api/export/invoices.csv/route.ts");
  const audit = readProjectFile("lib/audit.ts");

  assert.match(exportRoute, /"serie"/);
  assert.match(exportRoute, /"numero_secuencial"/);
  assert.match(exportRoute, /"emitida_en"/);
  assert.match(exportRoute, /"anulada_en"/);
  assert.match(exportRoute, /"estado_fiscal"/);
  assert.match(exportRoute, /csv_export_generated/);
  assert.match(exportRoute, /createAuditLog/);
  assert.doesNotMatch(exportRoute, /\.update\(/);
  assert.doesNotMatch(exportRoute, /\.delete\(/);
  assert.match(audit, /metadata: metadata \?\? null/);
});

test("future AEAT, XML, QR and hash code is scaffolded without real submission", () => {
  const hash = readProjectFile("lib/fiscal/hash.ts");
  const qr = readProjectFile("lib/fiscal/qr.ts");
  const xml = readProjectFile("lib/fiscal/aeat/xml.ts");
  const client = readProjectFile("lib/fiscal/aeat/client.ts");
  const roadmap = readProjectFile("docs/verifactu-roadmap.md");

  assert.match(hash, /TODO VERIFACTU: validar campos exactos/);
  assert.match(hash, /No debe presentarse como hash VeriFactu oficial/);
  assert.match(qr, /TODO VERIFACTU: implementar QR unicamente/);
  assert.match(qr, /throw new Error/);
  assert.match(xml, /validar contra XSD oficial/);
  assert.match(client, /Envio AEAT no implementado/);
  assert.match(roadmap, /Real Decreto 1007\/2023/);
  assert.match(roadmap, /Orden HAC\/1177\/2024/);
  assert.doesNotMatch(client, /fetch\(/);
  assert.doesNotMatch(client, /XMLHttpRequest|axios/);
});

test("public UI avoids prohibited VeriFactu and AEAT compliance claims", () => {
  const publicText = [
    readProjectFile("lib/i18n.ts"),
    readProjectFile("app/page.tsx"),
    readProjectFile("app/pricing/page.tsx"),
    readProjectFile("components/document-print.tsx"),
  ].join("\n");

  assert.doesNotMatch(publicText, /cumple VeriFactu/i);
  assert.doesNotMatch(publicText, /cumple AEAT/i);
  assert.doesNotMatch(publicText, /software certificado/i);
  assert.doesNotMatch(publicText, /certificado AEAT/i);
  assert.doesNotMatch(publicText, /homologado/i);
  assert.doesNotMatch(publicText, /factura verificable/i);
  assert.doesNotMatch(publicText, /QR VeriFactu/i);
  assert.doesNotMatch(publicText, /VERI\*FACTU/);
});

test("private beta disables real payments and removes legal placeholders", () => {
  const betaConfig = readProjectFile("lib/beta-config.ts");
  const billingActions = readProjectFile("app/actions/billing.ts");
  const billingPage = readProjectFile("app/(private)/settings/billing/page.tsx");
  const pricingPage = readProjectFile("app/pricing/page.tsx");
  const homePage = readProjectFile("app/page.tsx");
  const footer = readProjectFile("components/legal-footer.tsx");
  const envExample = readProjectFile(".env.example");
  const legalPages = [
    "app/legal/aviso-legal/page.tsx",
    "app/legal/privacidad/page.tsx",
    "app/legal/cookies/page.tsx",
    "app/legal/terminos/page.tsx",
  ]
    .map(readProjectFile)
    .join("\n");
  const packageJson = readProjectFile("package.json");
  const layout = readProjectFile("app/layout.tsx");

  assert.match(betaConfig, /BETA_MODE/);
  assert.match(betaConfig, /PAYMENTS_ENABLED/);
  assert.match(betaConfig, /STRIPE_LIVE_ENABLED/);
  assert.match(envExample, /BETA_MODE=true/);
  assert.match(envExample, /PAYMENTS_ENABLED=false/);
  assert.match(envExample, /STRIPE_LIVE_ENABLED=false/);
  assert.match(billingActions, /isBetaMode\(\) \|\| !arePaymentsEnabled\(\)/);
  assert.match(billingActions, /secretKey\.startsWith\("sk_live_"\)/);
  assert.match(billingPage, /paymentsAvailable \? \(/);
  assert.match(billingPage, /betaAccessHref/);
  assert.match(pricingPage, /betaAccessHref/);
  assert.match(homePage, /t\.home\.betaNotice/);
  assert.match(betaConfig, /legal: "faktudash@gmail\.com"/);
  assert.match(betaConfig, /privacy: "faktudash@gmail\.com"/);
  assert.match(betaConfig, /support: "faktudash@gmail\.com"/);
  assert.match(footer, /contactEmails\.legal/);
  assert.match(footer, /contactEmails\.privacy/);
  assert.match(footer, /contactEmails\.support/);
  assert.doesNotMatch(legalPages, /pendiente de completar|sustituye este texto|\[tu nombre\]|\[NIF\]|\[CIF\]|\[direccion\]|\[dirección\]/i);
  assert.match(legalPages, /no utiliza cookies de analisis/);
  assert.doesNotMatch(packageJson, /@vercel\/analytics|@vercel\/speed-insights|posthog|hotjar|clarity/i);
  assert.doesNotMatch(layout + homePage, /GoogleAnalytics|gtag|fbq|posthog|hotjar|clarity/i);
});
