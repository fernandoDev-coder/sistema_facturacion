import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { extname } from "node:path";
import test from "node:test";

function readProjectFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function listTextProjectFiles(dir = new URL("../", import.meta.url)) {
  const ignoredDirs = new Set([".git", ".next", "node_modules"]);
  const textExtensions = new Set([".js", ".mjs", ".ts", ".tsx", ".sql", ".md", ".yml", ".yaml", ".json", ".example"]);
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        files.push(...listTextProjectFiles(new URL(`${entry.name}/`, dir)));
      }
      continue;
    }

    const extension = extname(entry.name);
    if (textExtensions.has(extension) || entry.name === ".env.example") {
      files.push(new URL(entry.name, dir));
    }
  }

  return files;
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

test("privileged access is not granted from hardcoded emails", () => {
  const profiles = readProjectFile("lib/profiles.ts");
  const syncScript = readProjectFile("scripts/sync-special-access.mjs");

  assert.doesNotMatch(profiles, /@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  assert.doesNotMatch(profiles, /getSpecialAccessUpdate|system.+Admin.+Email|complimentary.+Premium.+Email/);
  assert.match(profiles, /return \[\]/);
  assert.match(syncScript, /normalizeRequiredEmail\(env, "SUPER_ADMIN_EMAIL"\)/);
  assert.match(syncScript, /normalizeRequiredEmail\(env, "LIFETIME_PREMIUM_EMAIL"\)/);
  assert.match(syncScript, /redactEmail/);
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
  assert.match(companyAction, /randomUUID\(\)/);
  assert.match(companyAction, /storage\.list\(ownerId/);
  assert.match(companyAction, /storage\.upload\(objectPath, Buffer\.from\(await value\.arrayBuffer\(\)\)/);
  assert.match(companyAction, /upsert: false/);
  assert.match(settingsPage, /encType="multipart\/form-data"/);
  assert.match(settingsPage, /name="logo_file"/);
  assert.match(schema, /insert into storage\.buckets \(id, name, public, file_size_limit, allowed_mime_types\)/);
  assert.match(schema, /\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
  assert.match(nextConfig, /bodySizeLimit: "3mb"/);
});

test("profile access fields are protected and audited in SQL", () => {
  const schema = readProjectFile("supabase/schema.sql");
  const migration = readProjectFile("supabase/migrations/20260714153000_harden_profile_access.sql");
  const sql = `${schema}\n${migration}`;

  assert.match(sql, /create or replace function public\.protect_profile_sensitive_fields\(\)/);
  assert.match(sql, /profile access fields can only be changed by service role/);
  assert.match(sql, /before insert or update on public\.profiles/);
  assert.match(sql, /revoke update on public\.profiles from authenticated/);
  assert.match(sql, /grant update \(email, full_name, onboarding_completed_at\) on public\.profiles to authenticated/);
  assert.match(sql, /revoke insert on public\.profiles from authenticated/);
  assert.match(sql, /profile_access_changed/);
  assert.match(sql, /has_lifetime_access/);
});

test("seed scripts are blocked outside explicit development or test runs", () => {
  const helper = readProjectFile("scripts/admin-script-utils.mjs");
  const seedUser = readProjectFile("scripts/seed-free-user.mjs");
  const seedDemo = readProjectFile("scripts/seed-demo-data.mjs");
  const result = spawnSync(process.execPath, ["scripts/seed-free-user.mjs", "free"], {
    cwd: new URL("../", import.meta.url),
    env: {
      ...process.env,
      NODE_ENV: "production",
      APP_ENV: "development",
      ALLOW_SEED_DATA: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "dummy",
      SEED_FREE_USER_EMAIL: "seed@example.test",
      SEED_FREE_USER_PASSWORD: "TestPassword123!",
    },
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /NODE_ENV=production/);
  assert.match(helper, /ALLOW_SEED_DATA !== "true"/);
  assert.match(helper, /APP_ENV debe ser development o test/);
  assert.match(helper, /CONFIRM_SEED_PROJECT/);
  assert.doesNotMatch(seedUser, /subscriptions"\)\s*\.update/);
  assert.match(seedUser, /validatePrivatePassword/);
  assert.match(seedDemo, /assertSafeSeedEnvironment/);
});

test("repository does not contain published default passwords or privileged personal emails", () => {
  const combined = listTextProjectFiles()
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  const publishedSeedPassword = ["Test", "Gratis", "2026", "!"].join("");
  const privilegedEmailNames = new RegExp(`${["fernando", "laramillan"].join("")}|${["jandry", "38"].join("")}`, "i");
  const oldContactEmail = new RegExp(`${["faktudash", "gmail"].join("@").replace("@", "@")}\\.com`, "i");

  assert.doesNotMatch(combined, new RegExp(publishedSeedPassword.replace("!", "\\!")));
  assert.doesNotMatch(combined, privilegedEmailNames);
  assert.doesNotMatch(combined, oldContactEmail);
  assert.doesNotMatch(readProjectFile(".env.example"), /SEED_FREE_USER_PASSWORD=.+/);
  assert.match(readProjectFile(".env.example"), /SUPER_ADMIN_EMAIL=\n/);
  assert.match(readProjectFile(".env.example"), /LIFETIME_PREMIUM_EMAIL=\n/);
});

test("service role stays in server-only modules or node scripts", () => {
  const serverModule = readProjectFile("lib/supabase/server.ts");
  const serviceRoleReferences = listTextProjectFiles()
    .filter((file) => readFileSync(file, "utf8").includes("SUPABASE_SERVICE_ROLE_KEY"))
    .map((file) => decodeURIComponent(file.pathname).replaceAll("\\", "/"));

  assert.match(serverModule, /import "server-only"/);
  assert.doesNotMatch(readProjectFile(".env.example"), /NEXT_PUBLIC_.*SERVICE_ROLE/i);
  assert.ok(
    serviceRoleReferences.every((path) => {
      const normalized = decodeURIComponent(path).replaceAll("\\", "/");
      return normalized.includes("/scripts/")
        || normalized.endsWith("/lib/supabase/server.ts")
        || normalized.endsWith("/.env.example")
        || normalized.endsWith("/README.md")
        || normalized.endsWith("/SECURITY_CLEANUP.md")
        || normalized.endsWith("/tests/security-static.test.mjs");
    }),
  );
});

test("client and company forms suggest postal codes from city input", () => {
  const postalCodeFields = readProjectFile("components/postal-code-fields.tsx");
  const communityForm = readProjectFile("components/community-form.tsx");
  const companyPage = readProjectFile("app/(private)/settings/company/page.tsx");
  const postalCodeSuggestions = readProjectFile("lib/postal-code-suggestions.ts");

  assert.match(postalCodeFields, /getPostalCodeSuggestions\(city, province\)/);
  assert.match(postalCodeFields, /onBlur=\{handleCityBlur\}/);
  assert.match(postalCodeFields, /name="postal_code"/);
  assert.match(communityForm, /<PostalCodeFields/);
  assert.match(companyPage, /<PostalCodeFields/);
  assert.match(postalCodeSuggestions, /city: "Valencia"/);
  assert.match(postalCodeSuggestions, /postalCodes: \["46900"\]/);
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
  assert.match(migration, /notify pgrst, 'reload schema'/);
  assert.match(migration, /record_type', 'alta'/);
  assert.match(migration, /record_type', 'anulacion'/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /previous_record_id/);
  assert.match(migration, /chain_sequence/);
  assert.match(invoiceActions, /export async function issueInvoice\(invoiceId: string, userId: string\)/);
  assert.match(invoiceActions, /export async function cancelInvoice\(invoiceId: string, userId: string, reason: string\)/);
  assert.match(invoiceActions, /translateFiscalRpcError/);
  assert.match(invoiceActions, /PGRST202/);
  assert.match(invoiceActions, /20260603093000_verifactu_architecture_alignment\.sql/);
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

test("invoice amount fields accept comma decimal input", () => {
  const invoiceForm = readProjectFile("components/invoice-form.tsx");
  const createMonthForm = readProjectFile("components/create-month-form.tsx");

  assert.match(invoiceForm, /inputMode="decimal"/);
  assert.match(invoiceForm, /placeholder="0,00"/);
  assert.match(createMonthForm, /inputMode="decimal"/);
  assert.match(createMonthForm, /placeholder="0,00"/);
  assert.match(readProjectFile("lib/format.ts"), /\.replace\(",", "\."\)/);
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
  assert.match(betaConfig, /NEXT_PUBLIC_LEGAL_CONTACT_EMAIL/);
  assert.match(betaConfig, /NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL/);
  assert.match(betaConfig, /NEXT_PUBLIC_SUPPORT_CONTACT_EMAIL/);
  assert.doesNotMatch(betaConfig, /gmail|hotmail/i);
  assert.match(footer, /contactEmails\.legal/);
  assert.match(footer, /contactEmails\.privacy/);
  assert.match(footer, /contactEmails\.support/);
  assert.doesNotMatch(legalPages, /pendiente de completar|sustituye este texto|\[tu nombre\]|\[NIF\]|\[CIF\]|\[direccion\]|\[dirección\]/i);
  assert.match(legalPages, /no utiliza cookies de analisis/);
  assert.doesNotMatch(packageJson, /@vercel\/analytics|@vercel\/speed-insights|posthog|hotjar|clarity/i);
  assert.doesNotMatch(layout + homePage, /GoogleAnalytics|gtag|fbq|posthog|hotjar|clarity/i);
});

test("CSP separates development from production and keeps core hardening directives", () => {
  const nextConfig = readProjectFile("next.config.ts");

  assert.match(nextConfig, /const scriptSrc = isDevelopment/);
  assert.match(nextConfig, /\["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:\/\/js\.stripe\.com"\]/);
  assert.match(nextConfig, /\["'self'", "https:\/\/js\.stripe\.com"\]/);
  assert.match(nextConfig, /\["frame-ancestors", "'none'"\]/);
  assert.match(nextConfig, /\["object-src", "'none'"\]/);
  assert.match(nextConfig, /\["base-uri", "'self'"\]/);
  assert.match(nextConfig, /\["form-action", "'self'"\]/);
});

test("administrative routes and Stripe webhook enforce authorization boundaries", () => {
  const adminPage = readProjectFile("app/(private)/admin/users/page.tsx");
  const webhook = readProjectFile("app/api/stripe/webhook/route.ts");

  assert.match(adminPage, /requireUser\(\)/);
  assert.match(adminPage, /profile\?\.is_super_admin/);
  assert.match(adminPage, /redirect\("\/dashboard"\)/);
  assert.match(webhook, /request\.headers\.get\("stripe-signature"\)/);
  assert.match(webhook, /stripe\.webhooks\.constructEvent\(body, signature, webhookSecret\)/);
});

test("CI runs security checks and Dependabot is configured", () => {
  const ci = readProjectFile(".github/workflows/ci.yml");
  const dependabot = readProjectFile(".github/dependabot.yml");

  assert.match(ci, /npm ci/);
  assert.match(ci, /npm run lint/);
  assert.match(ci, /npm test/);
  assert.match(ci, /npm run build/);
  assert.match(ci, /npm audit --audit-level=high/);
  assert.match(ci, /gitleaks\/gitleaks-action/);
  assert.match(ci, /contents: read/);
  assert.match(dependabot, /package-ecosystem: "npm"/);
  assert.match(dependabot, /package-ecosystem: "github-actions"/);
});
